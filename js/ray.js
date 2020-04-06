let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
const EPSILON = 0.00001;

const vecI = new Vec3D(1.0, 0, 0);
const vecJ = new Vec3D(0, 1.0, 0);
const vecK = new Vec3D(0, 0, 1.0);
const negVecI = new Vec3D(-1.0, 0, 0);
const negVecJ = new Vec3D(0, -1.0, 0);
const negVecK = new Vec3D(0, 0, -1.0);
const origin = new Vec3D(0, 0, 0);

const lightGray = new Vec3D(0.85, 0.85, 0.85);
const darkGray = new Vec3D(0.3, 0.3, 0.3);
const purple = new Vec3D(0.8, 0.2, 0.9);
const blue = new Vec3D(0.1, .25, 0.8);
const white = new Vec3D(0.9, 0.9, 1);
const green = new Vec3D(0.2, 0.9, 0.5);
const red = new Vec3D(0.9, 0.2, 0.1);
const blueGreen = new Vec3D(0.2, 0.9, 0.85);
const lightBlue = new Vec3D(0.1, 0.1, 0.6);


function near(x, y) {
  return Math.abs(x - y) < 2 * EPSILON;
}


class Camera { // incorporates Eye and Viewport
  constructor(eyePos, target, up, theta, numRows, numCols) {
    // 'target' is center of viewport
    // 'up' is up direction relative to eye, assumed to be parallel to viewport up
    this.eyePos = eyePos;                                            // Vec3D, position of 'eye'
    this.eyeDir = target.minus(eyePos).toUnitVector();               // unit Vec3D, "straight ahead"
    console.assert(near(this.eyeDir.dot(up), 0));
    this.eyeB = up.toUnitVector().cross(this.eyeDir).toUnitVector(); // unit Vec3D, "right"
    this.eyeV = this.eyeDir.cross(this.eyeB).toUnitVector();         // unit Vec3D, "up"
    this.theta = theta;                                              // field of view
    this.m = numRows;                                                // a.k.a. height in pixels
    this.k = numCols;                                                // a.k.a. width in pixels
  }

  toString() {
    let s = [
      'Camera:',
      `  Eye position: ${this.eyePos.toString()}`,
      `  Eye direction: ${this.eyeDir.toString()}`,
      `  right (eyeB): ${this.eyeB.toString()}`,
      `  up (eyeV): ${this.eyeV.toString()}`,
      `  field of view: ${this.theta.toFixed(5)}`,
      `  pixel height: ${this.m}`,
      `  pixel width: ${this.k}`
    ];
    return s.join('\n');
  }
}


class RayTracer {
  constructor(camera, scene, lights) { //eye, viewport, scene, lights) {
    this.camera = camera; // Camera object
    this.scene = scene;   // array of SceneObject objects
    this.lights = lights; // array of LightSouce objects
    this.shiftX;
    this.shiftY;
    this.p_1m;            // vector in direction from eye to pixel at i=1, j=m
    this.defaultColor = new Vec3D(0, 0, 0);
    this.ambientColor = new Vec3D(0.33, 0.35, 0.35);
    this.setShiftVectors();
  }

  toString() {
    let s = [
      'RayTracingEnsemble:',
      this.camera.toString(),
      `  shiftX = ${this.shiftY}`,
      `  shiftY = ${this.shiftX}`,
      `  p_1m = ${this.p_1m}`,
      'Lights:\n  ' + this.lights.map(x => x.toString()).join('\n  '),
      `Scene: ${this.scene.length} objects\n  `,
      this.scene.map(o => o.toString()).join('\n  ')
    ];
    return s.join('\n');
  }

  setShiftVectors() {
    let g_x = Math.tan(0.5 * this.camera.theta);
    let g_y = g_x * this.camera.m / this.camera.k;
    this.shiftX = this.camera.eyeB.scale(2 * g_x / (this.camera.k - 1));
    this.shiftY = this.camera.eyeV.scale(2 * g_y / (this.camera.m - 1));
    this.p_1m = this.camera.eyeDir
      .minus(this.camera.eyeB.scale(g_x))
      .minus(this.camera.eyeV.scale(g_y));
  }

  rayDirection(i, j) {
    // 1 <= i <= k; 1 <= j <= m, indices of pixel
    return this.p_1m
      .plus(this.shiftX.scale(i - 1))
      .plus(this.shiftY.scale(j - 1))
      .toUnitVector();
  }

  trace(rayBase, rayDir) {
    let nearestObjIndex = -1;
    let tMin = Number.POSITIVE_INFINITY;
    for (let k=0; k<this.scene.length; k++) {
      let t = this.scene[k].rayIntersects(rayBase, rayDir);
      if (EPSILON < t && t < tMin) {
        tMin = t;
        nearestObjIndex = k;
      }
    }
    if (nearestObjIndex > -1) {
      let pt = rayBase.plus(rayDir.scale(tMin));
      // basic version -> no shading:
      //return this.scene[nearestObjIndex].colorFn(pt);
      // more advanced -> some shading:
      return this.scene[nearestObjIndex].shadeFn(pt, rayDir, this.lights, this.scene, this.ambientColor);
    }
    return this.defaultColor;
  }

  draw() {
    let imageData = canvasUtil.ctx.createImageData(this.camera.k, this.camera.m);
    let t0 = (new Date()).getTime();
    for (let i=1; i<=this.camera.k; i++) {
      for (let j=1; j<=this.camera.m; j++) {
        let rayDir = this.rayDirection(i, j);
        let color = this.trace(this.camera.eyePos, rayDir);
        let pixelIndex = ((this.camera.m - j) * this.camera.k + i) * 4;
        imageData.data[pixelIndex] = Math.floor(256 * color.x);
        imageData.data[pixelIndex+1] = Math.floor(256 * color.y);
        imageData.data[pixelIndex+2] = Math.floor(256 * color.z);
        imageData.data[pixelIndex+3] = 255;   // Alpha
      }
    }
    canvasUtil.ctx.putImageData(imageData, 0, 0);
    let t1 = (new Date()).getTime();
    canvasUtil.println(`Drawing completed in ${(t1 - t0)/1000} seconds.`);
  }
}


class Material {
  // Handle properties needed for Lambertian and Binn-Phong shading
  constructor(kDiffuse, kSpecular, powSpecular) {
    this.kDiffuse = kDiffuse;
    this.kSpecular = kSpecular;
    this.powSpecular = powSpecular;
  }

  toString() {
    return `diffuse coeff = ${this.kDiffuse}; specular coeff = ${this.kSpecular}; specular exp = ${this.powSpecular}`;
  }
}


class Surface {
  constructor(p0, colorFn, material) {
    this.p0 = p0;             // Vec3D, point used to define the surface (may or may not actually be on the surace)
    this.colorFn = colorFn;   // Vec3D -> Color
    this.material = material; // Material object
  }

  normalFn(p) {
    // return the normal vector at a point p (assumed to be on the surface)
  }

  shadeFn(point, rayDir, lights, scene, ambient) {
    // calculate the color at a given point on the surface
    let eyeDir = rayDir.scale(-1); // to eye
    let lightContrib = ambient; // will accumulate lighting contributions starting with this initial value
    for (let r=0; r<lights.length; r++) {
      let lightVec = lights[r].pos.minus(point); // to light source
      let lightDir = lightVec.toUnitVector();
      let distToLight = lightVec.norm();

      // check to see if path to light is blocked
      let blocked = false;
      for (let k=0; k<scene.length; k++) {
        let t = scene[k].rayIntersects(point, lightDir);
        if (t && EPSILON < t && t < distToLight) { // limit from below t to avoid shadow acne
          blocked = true;
          k = scene.length; // enough to know that anything is blocking
        }
      }
      if (!blocked) {
        // light = ambient + diffuse (lambertian) + specular (binn-phong)
        let normal = this.normalFn(point);
        let diffuse = lights[r].color.scale(this.material.kDiffuse * Math.max(0, normal.dot(lightDir)));
        let h = eyeDir.plus(lightDir).toUnitVector(); // for specularly reflected light
        let specular = lights[r].color.scale(this.material.kSpecular * Math.pow(Math.max(0, normal.dot(h)), this.material.powSpecular));
        lightContrib = lightContrib.plus(diffuse).plus(specular);
      }
    }
    return this.colorFn(point).times(lightContrib);
  }
}


class Plane extends Surface {
  // given normal n and point p0 on the plane, point p is on plane iff n.(p-p0)=0
  constructor(p0, colorFn, material, normal) {
    super(p0, colorFn, material);
    this.normal = normal.toUnitVector(); // Vec3D
  }

  normalFn(p) {
    // the normal vector is constant for a plane
    return this.normal;
  }

  rayIntersects(rayBase, rayDir) {
    // a ray r(t) = r0 + t*d intersects the plane iff n.d != 0:
    // n.p0 = n.r(t0) = n.r0 + t0*n.d
    // =>  t0 = n.(p0-r0) / n.d
    let denom = this.normalFn(this.p0).dot(rayDir);
    if (denom != 0.0) {
      let t = this.normalFn(this.p0).dot(this.p0.minus(rayBase)) / denom;
      if (t > 0) {
        return t;
      }
    }
    return false;
  }

  toString() {
    return `Plane: p0 = ${this.p0}; ${this.material.toString()}; normal = ${this.normal}`;
  }
}


class Sphere extends Surface {
  // p0 is the center of the sphere
  constructor(p0, colorFn, material, radius) {
    super(p0, colorFn, material);
    this.radius = radius;
  }

  normalFn(p) {
    return p.minus(this.p0).toUnitVector();
  }

  rayIntersects(rayBase, rayDir) {
    // a ray R(t) = R0 + t*d intesects a sphere
    // let v = R0 - c
    // => r^2 = |R(t) - c|^2 = |R0 + t*d - c|^2 = |v + t*d|^2 = |v|^2 + 2t * v.d + t^2 |d|^2
    // => |d|^2 t^2 + (2 v.d) t + |v|^2 - r^2 = a*t^2 + b*t + c = 0
    // t = - v.d +/- sqrt((v.d)^2 - (|v|^2 - r^2))
    let v = rayBase.minus(this.p0);
    let vDotD = v.dot(rayDir);
    let discriminant = vDotD * vDotD - v.normSq() + this.radius * this.radius;
    if (discriminant >= 0.0) {
      let t0 = -1 * vDotD + Math.sqrt(discriminant);
      let t1 = -1 * vDotD - Math.sqrt(discriminant);
      if (Math.min(t0, t1) > 0) {
        return Math.min(t0, t1);
      }
    }
  }

  toString() {
    return `Sphere: center = ${this.p0}; ${this.material}; radius = ${this.radius}`;
  }
}


class Box extends Surface {
  constructor(p0, colorFn, material, p1) {
    // p0 is one corner of box
    super(p0, colorFn, material);
    this.p1 = p1; // Vec3D, opposite corner of box
    this.xMin = Math.min(p0.x, p1.x);
    this.xMax = Math.max(p0.x, p1.x);
    this.yMin = Math.min(p0.y, p1.y);
    this.yMax = Math.max(p0.y, p1.y);
    this.zMin = Math.min(p0.z, p1.z);
    this.zMax = Math.max(p0.z, p1.z);
  }

  normalFn(p) {
    if (near(p.x, this.xMax)) {
      return vecI;
    } else if (near(p.x, this.xMin)) {
      return negVecI;
    } else if (near(p.y, this.yMax)) {
      return vecJ;
    } else if (near(p.y, this.yMin)) {
      return negVecJ;
    } else if (near(p.z, this.zMax)) {
      return vecK;
    } else if (near(p.z, this.zMin)) {
      return negVecK;
    }
  }

  rayIntersects(rayBase, rayDir) {
    // check for ray intersections with 3 slabs, defined by x-, y-, z-ranges
    let tXmin = (this.xMin - rayBase.x) / rayDir.x;
    let tXmax = (this.xMax - rayBase.x) / rayDir.x;
    let tXenter = Math.min(tXmin, tXmax);
    let tXexit = Math.max(tXmin, tXmax);

    let tYmin = (this.yMin - rayBase.y) / rayDir.y;
    let tYmax = (this.yMax - rayBase.y) / rayDir.y;
    let tYenter = Math.min(tYmin, tYmax);
    let tYexit = Math.max(tYmin, tYmax);

    if ((tXenter > tYexit) || (tYenter > tXexit)) {
      return false
    }

    let tZmin = (this.zMin - rayBase.z) / rayDir.z;
    let tZmax = (this.zMax - rayBase.z) / rayDir.z;
    let tZenter = Math.min(tZmin, tZmax);
    let tZexit = Math.max(tZmin, tZmax);

    if ((tXenter > tZexit) || (tZenter > tXexit) || (tYenter > tZexit) || (tZenter > tYexit)) {
      return false;
    }

    let tEnter = Math.max(tXenter, tYenter, tZenter);
    let tExit = Math.min(tXexit, tYexit, tZexit);

    return Math.min(tEnter, tExit);
  }

  toString() {
    return `Box: [${this.xMin}, ${this.xMax}] x [${this.yMin}, ${this.yMax}] x [${this.zMin}, ${this.zMax}]; material = ${this.material}`;
  }
}


class VerticalCylinder extends Surface {
  // p0 is bottom center of cylinder
  constructor(p0, colorFn, material, height, radius, hasTop, hasBottom) {
    super(p0, colorFn, material);
    this.height = height;
    this.topZ = p0.z + height;
    this.bottomZ = p0.z;
    this.radius = radius;
    this.axisDir = vecK;
    this.hasTop = hasTop;
    this.hasBottom = hasBottom;
  }

  normalFn(p) {
    if (near(p.z, this.topZ)) {
      return vecK;
    } else if (near(p.z, this.bottomZ)) {
      return negVecK;
    } else {
      let center = this.p0.projXY();
      let p2d = p.projXY();
      let n = p2d.minus(center);
      return new Vec3D(n.x, n.y, 0);
    }
  }

  rayIntersects(rayBase, rayDir) {
    // a ray R(t) = R0 + t*d intesects cylinder |x-c|^2 = r^2 (c has z=0)
    // project c, R0, d to xy-plane, let v = R0 - c (d is not unit anymore!)
    // => r^2 = |R(t) - c|^2 = |R0 + t*d - c| = |v + t*d|^2 = |v|^2 + 2t * v.d + t^2 |d|^2
    // => t^2 + (2 v.d) t + |v|^2 - r^2 = 0
    // => t = (- v.d +/- sqrt((v.d)^2 - |d|^2 (|v|^2 - r^2))) / |d|^2
    let center = this.p0.projXY();
    let base = rayBase.projXY();
    let dir = rayDir.projXY();
    let v = base.minus(center);
    let vDotD = v.dot(dir);
    let discriminant = vDotD * vDotD - dir.normSq() * (v.normSq() - this.radius * this.radius);
    if (discriminant >= 0.0) {

      // side part
      let tCyl1 = (-1 * vDotD + Math.sqrt(discriminant)) / dir.normSq();
      let zCyl1 = rayBase.z + tCyl1 * rayDir.z;
      let tCyl2 = (-1 * vDotD - Math.sqrt(discriminant)) / dir.normSq();
      let zCyl2 = rayBase.z + tCyl2 * rayDir.z;

      let ts = [];
      if (this.bottomZ <= zCyl1 && zCyl1 <= this.topZ) {
        // intersects the side at appropriate  height
        ts.push(tCyl1);
      }

      if (this.bottomZ <= zCyl2 && zCyl2 <= this.topZ) {
        // intersects the side at appropriate  height
        ts.push(tCyl2);
      }

      if (this.hasTop && ((zCyl1 < this.topZ && this.topZ < zCyl2) || (zCyl2 < this.topZ && this.topZ < zCyl1))) {
        // ray passes through the top and hits the sides
        let tTop = (this.topZ - rayBase.z) / rayDir.z;
        ts.push(tTop);
      }

      if (this.hasBottom && ((zCyl1 < this.bottomZ && this.bottomZ < zCyl2) || (zCyl2 < this.bottomZ && this.bottomZ < zCyl1))) {
        // ray passes through the bottom
        let tBottom = (this.bottomZ - rayBase.z) / rayDir.z;
        ts.push(tBottom);
      }

      // case when ray is parallel to the cylinder
      let xyDistSq = (rayBase.x - this.p0.x) * (rayBase.x - this.p0.x) + (rayBase.y - this.p0.y) * (rayBase.y - this.p0.y);
      if (near(1.0, Math.abs(rayDir.dot(vecK))) && (xyDistSq < this.radius * this.radius)) {
        if (this.hasTop) {
          let tTop = (this.topZ - rayBase.z) / rayDir.z;
          ts.push(tTop);
        }
        if (this.hasBottom) {
          let tBottom = (this.bottomZ - rayBase.z) / rayDir.z;
          ts.push(tBottom);
        }
      }

      let t = Math.min(...ts);
      if (t > 0 && t < Number.POSITIVE_INFINITY) {
        return t;
      }
    }
  }

  toString() {
    return `Cylinder: p0 = ${this.p0.toString()}; height = ${this.height}; radius = ${this.radius}}; has top ? ${this.hasTop}; has bottom ? ${this.hasBottom}`;
  }
}


class Paraboloid extends Surface {
  // a * (x-x0)^2 + b * (y-y0)^2 - (z-z0) = 0
  // signs of a, b make this elliptic or hyperbolic
  // p0 is (x0, y0, z0)
  constructor(p0, colorFn, material, a, b, domainFn) {
    super(p0, colorFn, material);
    this.a = a;
    this.b = b;
    this.domainFn = domainFn; // Vec2D -> Boolean
    this.f = v => this.a * (v.x - this.p0.x) * (v.x - this.p0.x) + this.b * (v.y - this.p0.y) * (v.y - this.p0.y) + this.p0.z;
    this.f_x = v => 2 * this.a * (v.x - this.p0.x); // partial derivative WRT x
    this.f_y = v => 2 * this.b * (v.y - this.p0.y); // partial derivative WRT y
  }

  normalFn(p) {
    // this is always the upward-pointing normal
    // let F(x, y, z) = z - f(x, y)
    // N' = grad F = (-f_x, -f_y, 1) = (2*a*(vx - x0), 2*b*(vy - y0), 1) is non-unit normal
    // |N'|^2 = 4*a^2*(vx - x0)^2 + 4*b^2*(vy - y0)^2 + 1
    // N = N' / |N'| is unit normal
    return (new Vec3D(-1 * this.f_x(p), -1 * this.f_y(p), 1)).toUnitVector(); // TODO: can this be optimized?
  }

  rayIntersects(rayBase, rayDir) {
    // ray R(t) = r0 + t*d, surface eqn: a(x-x0)^2 + b(y-y0)^2 - (z-z0) = 0
    // => 0 = a*(rx + t*dx - x0)^2 + b*(ry + t*dy - y0)^2 - (rz + t*dz - z0)
    //      = a*(rx-x0)^2 + a*dx^2*t^2 + 2a*(rx-x0)*dx*t + b*(ry-y0)^2 + b*dy^2*t^2 + 2b*(ry-y0)*dy*t - (rz-z0) - dz*t
    //      = [a*dx^2 + b*dy^2] t^2 + [2a*(rx-x0)*dx + 2b*(ry-y0)*dy - dz] t + [a*(rx-x0)^2 + b*(ry-y0)^2 - (rz-z0)]
    //      = A t^2 + B t + C
    let A = this.a * rayDir.x * rayDir.x + this.b * rayDir.y * rayDir.y;
    let B = 2 * this.a * (rayBase.x - this.p0.x) * rayDir.x + 2 * this.b * (rayBase.y - this.p0.y) * rayDir.y - rayDir.z;
    let C = this.a * (rayBase.x - this.p0.x) * (rayBase.x -  this.p0.x) + this.b * (rayBase.y - this.p0.y) * (rayBase.y - this.p0.y) - (rayBase.z - this.p0.z);
    let D = B * B - 4 * A * C;
    //console.log(`-->D = ${D}`);
    if (D >= 0) {
      let ts = [
        (-1 * B + Math.sqrt(D)) / (2 * A),
        (-1 * B - Math.sqrt(D)) / (2 * A)
      ];
      //console.log(`-->t0 = ${ts[0]}; t1 = ${ts[1]}`);
      let t = Math.min(...ts.filter(t => t >0));
      if (t < Number.POSITIVE_INFINITY) {
        let pt = rayBase.plus(rayDir.scale(t));
        if (this.domainFn(pt)) {
          return t;
        }
      }
    }
  }

  toString() {
    return `Paraboloid: a = ${this.a}; b = ${this.b}; p0 = ${this.p0}; material = ${this.material.toString()};`
  }
}

class LightSource {
  constructor(position, color) {
    this.pos = position; // Vec3D
    this.color = color;  // Vec3D -> color
  }

  toString() {
    return `pos = ${this.pos.toString()}; color = ${this.color.toString()}`;
  }
}

// Test Cases:

const m1 = new Material(1.0, 0.0, 0.0); // no specular effects
const m2 = new Material(0.75, 0.8, 15);
const m3 = new Material(0.5, 1.0, 25);

const planeTestScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray.minus(purple).scale(0.5 * Math.sin(0.5 * p.z + 0.5 * p.y) + 1).plus(purple), // smoothed stripes
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, 5, 0),
    v => lightGray,
    m1,
    negVecJ
  ),
  new Plane( // right
    new Vec3D(0, -5, 0),
    v => lightGray,
    m1,
    vecJ
  )
];

const planeTestLights = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.85, 0.95, 0.72))
];


const sphereTestScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -2),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new Sphere(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? white : red, // stripes,
    m2,
    1
  ),
  new Sphere(
    new Vec3D(0, 0, 3),
    v => green,
    m2,
    0.5
  )
];

const sphereTestLights = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(0, 5, 5), new Vec3D(0.75, 0.75, 0.62))
];


const boxTestScene = [
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new Box(
    new Vec3D(5, 2, 0),
    v => blueGreen,
    m1,
    new Vec3D(2, 3, 1.5)
  ),
  new Box(
    new Vec3D(1.5, -3.0, 1.75),
    v => green,
    m1,
    new Vec3D(5.5, -0.75, 2.5)
  )
];

const boxTestLights = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.55, 0.72)),
  new LightSource(new Vec3D(0, 5, 5), new Vec3D(0.75, 0.75, 0.52))
];


const cylinderTestScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new VerticalCylinder(
    new Vec3D(0, 3, 2),
    v => purple,
    m2,
    0.5,
    1,
    true,
    false
  ),
  new VerticalCylinder(
    new Vec3D(0, 0, 0),
    v => red,
    m2,
    1,
    2,
    false,
    false
  ),
  new VerticalCylinder(
    new Vec3D(0, -3, -2),
    v => green,
    m2,
    0.5,
    1,
    false,
    true
  )
];

const cylinderTestLights = [
  new LightSource(new Vec3D(0, 0, 0.5), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(0, 0, 5), new Vec3D(0.75, 0.75, 0.62))
];


const paraboloidTestScene1 = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => lightGray,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? blue : lightGray, // stripes
    m2,
    -0.05,
    0.05,
    p => true,
  )
];

const paraboloidTestLights1 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
 ];


// rim issue
const paraboloidTestScene2 = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => (parseInt(Math.round(p.y) + Math.round(p.z)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    negVecI
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? red : lightGray, // stripes
    m2,
    -0.15,
    0.15,
    p => -2 <= p.x && p.x <= 2 && -2 <= p.y && p.y <= 2 // rectangle
  )
];

const paraboloidTestLights2 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
];


// rim issue
const paraboloidTestScene3 = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => (parseInt(Math.round(p.y) + Math.round(p.z)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    negVecI
  ),
  new Paraboloid(
    new Vec3D(0, 0, 2),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? red : lightGray, // stripes
    m2,
    0.15,
    0.15,
    p => p.x * p.x + p.y * p.y < 3 * 3 // disk
  )
];

const paraboloidTestLights3 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
];


// objects are only partially observed depending on if camera is above/below the "rim" (if upward/downward opening)
const paraboloidTestScene4 = [
  new Plane( // bottom
    new Vec3D(0, 0, -2),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(2 * p.x) + Math.round(2 * p.y)) % 2 == 0) ? blue : red, // checkerboard
    m2,
    -0.2,
    -0.2,
    p => p.x * p.x + p.y * p.y < 4 // disk
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(2 * p.x) + Math.round(2 * p.y)) % 2 == 0) ? blue : red, // checkerboard
    m2,
    0.2,
    0.2,
    p => p.x * p.x + p.y * p.y < 4 // disk
  )
];

const paraboloidTestLights4 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(0, 5, 0), new Vec3D(0.75, 0.75, 0.62)),
];

const cylCenter = new Vec3D(5, 0, -2);
const testScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -3),
    p => darkGray,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -7, 0),
    p => lightGray.minus(purple).scale(0.5 * Math.sin(0.5 * p.z + 0.5 * p.y) + 1).plus(purple), // smoothed stripes,
    m1,
    vecJ
  ),
  new Sphere(
    new Vec3D(5, 0, 6),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? blueGreen : red, // stripes,
    m2,
    2
  ),
  new Paraboloid(
    new Vec3D(5, 0, -2),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? blue : lightGray, // stripes
    m2,
    -0.12,
    0.12,
    p => true
  ),
  new Paraboloid(
    new Vec3D(2, 4.5, -0.5),
    p => (parseInt(Math.round(2 * p.x) + Math.round(2 * p.y)) % 2 == 0) ? blueGreen : darkGray, // checkerboard
    m2,
    -0.15,
    -0.15,
    p => (p.x + 1) * (p.x + 1) + (p.y - 3) * (p.y - 3)  < 4 * 4 // disk
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    1,
    1.5,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => red,
    m2,
    1.5,
    1.25,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    2.25,
    1,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => red,
    m2,
    3,
    0.75,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    4,
    0.5,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => red,
    m2,
    5,
    0.25,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    15,
    0.125,
    false,
    false
  ),
  new Box(
    new Vec3D(5, -7, -2),
    v => green,
    m1,
    new Vec3D(-2, -2, -15)
  )
  ,
  new Box(
    new Vec3D(5, -7, -2),
    v => purple,
    m1,
    new Vec3D(-1, -3, -1)
  ),
  new Box(
    new Vec3D(5, -7, -1),
    v => green,
    m1,
    new Vec3D(0, -4, 0)
  ),
  new Box(
    new Vec3D(5, -7, 0),
    v => purple,
    m1,
    new Vec3D(1, -5, 1)
  ),
  new Box(
    new Vec3D(5, -7, 1),
    v => green,
    m1,
    new Vec3D(2, -6, 2)
  )
];

const testLights = [
  new LightSource(new Vec3D(9, 3, 7), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(-10, -2, 8), new Vec3D(0.75, 0.75, 0.62))
];


function drawScene() {
  let sceneId = parseInt(document.parameters.scene_select.value);
  let x0 = parseFloat(document.parameters.camera_x.value);
  let y0 = parseFloat(document.parameters.camera_y.value);
  let z0 = parseFloat(document.parameters.camera_z.value);
  console.log(`sceneId = ${sceneId}; cameraX = ${x0}; cameraY = ${y0}; cameraZ = ${z0}`);

  fieldOfView = 0.55 * Math.PI * Math.sqrt(WIDTH / HEIGHT);
  canvasUtil.println(`fieldOfView = ${fieldOfView}`);

  let eyePos = new Vec3D(x0, y0, z0);
  let r0 = eyePos.norm();
  let phi0 = Math.atan2(y0, x0);
  let theta0 = Math.acos(z0 / r0);
  let eyeUp = new Vec3D(
    -1 * r0 * Math.cos(phi0) * Math.cos(theta0),
    -1 * r0 * Math.sin(phi0) * Math.cos(theta0),
    r0 * Math.sin(theta0)
  ).toUnitVector();

  console.log(`eyePos = ${eyePos.toString()}; eyeUp  =${eyeUp.toString()}; dot = ${eyePos.toUnitVector().dot(eyeUp)}`);
  // eyePos, target, up, numRows, numCols
  let camera = new Camera(
    eyePos, // position
    origin, // target
    eyeUp, // up
    fieldOfView,
    HEIGHT,
    WIDTH
  );

  let scene = [];
  let lights = [];
  switch (sceneId) {
    case 0:
      scene = testScene;
      lights = testLights;
      break;
    case 1:
      scene = planeTestScene;
      lights = planeTestLights;
      break;
    case 2:
      scene = sphereTestScene;
      lights = sphereTestLights;
      break;
    case 3:
      scene = boxTestScene;
      lights = boxTestLights;
      break;
    case 4:
      scene = cylinderTestScene;
      lights = cylinderTestLights;
      break;
    case 5:
      scene = paraboloidTestScene1;
      lights = paraboloidTestLights1;
      break;
    case 6:
      scene = paraboloidTestScene2;
      lights = paraboloidTestLights2;
      break;
    case 7:
      scene = paraboloidTestScene3;
      lights = paraboloidTestLights3;
      break;
    case 8:
      scene = paraboloidTestScene4;
      lights = paraboloidTestLights4;
      break;
  }

  let rt = new RayTracer(
    camera,
    scene,
    lights
  );
  canvasUtil.println(rt.toString());
  rt.draw();
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight) - 10;
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas();
    drawScene();
  } else {
    alert('You need a better web browser to see this.');
  }
}
