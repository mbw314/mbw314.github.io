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

const lightGray = new Vec3D(0.7, 0.7, 0.7);
const darkGray = new Vec3D(0.3, 0.3, 0.3);
const purple = new Vec3D(0.8, 0.2, 0.9);
const blue = new Vec3D(0.1, .25, 0.8);
const white = new Vec3D(0.9, 0.9, 1);
const green = new Vec3D(0.2, 0.9, 0.5);
const red = new Vec3D(1, 0.2, 0.1);
const blueGreen = new Vec3D(0.2, 0.9, 0.85);


function near(x, y) {
  return Math.abs(x - y) < 2 * EPSILON;
}


class Eye {
  constructor(e, target, viewportUp, theta) {
    this.e = e;                                       // Vec3D, position of 'eye'
    this.t = target.minus(this.e).toUnitVector();     // unit Vec3D, "straight ahead"
    this.b = viewportUp.cross(this.t).toUnitVector(); // unit Vec3D, "right"
    this.v = this.t.cross(this.b).toUnitVector();     // unit Vec3D, "up"
    this.theta = theta;                               // field of view
  }

  toString() {
    let s = [
      'Eye:',
      `  position (e): ${this.e.toString()}`,
      `  target (t): ${this.t.toString()}`,
      `  right (b): ${this.b.toString()}`,
      `  up (v): ${this.v.toString()}`,
      `  theta: ${this.theta.toFixed(5)}`
    ];
    return s.join('\n');
  }
}


class Viewport {
  constructor(center, up, numRows, numCols) {
    this.c = center;  // Vec3D
    this.w = up;      // Vec3D
    this.m = numRows; // a.k.a. height in pixels
    this.k = numCols; // a.k.a. width in pixels
  }

  toString() {
    let s = [
      'Viewport: ',
      `  dimensions; ${this.m} rows x ${this.k} cols`,
      `  center = ${this.c.toString()}`,
      `  up = ${this.w.toString()}`
    ];
    return s.join('\n')
  }
}

class RayTracer {
  constructor(eye, viewport, scene, lights) {
    this.eye = eye;           // Eye object
    this.viewport = viewport; // Viewport object
    this.scene = scene;       // array of SceneObject objects
    this.lights = lights;     // for now, array of LightSouce objects
    this.shiftX;
    this.shiftY;
    this.p_1m;                // vector in direction from eye to pixel at i=1, j=m
    this.defaultColor = new Vec3D(0, 0, 0);
    this.ambientColor = new Vec3D(0.33, 0.35, 0.35);
    this.setShiftVectors();
  }

  toString() {
    let s = [
      'RayTracingEnsemble:',
      this.eye.toString(),
      this.viewport.toString(),
      `  shiftX = ${this.shiftY}`,
      `  shiftY = ${this.shiftX}`,
      `  p_1m = ${this.p_1m}`,
      'Lights:\n  ' + this.lights.map(x => x.toString()).join('\n  '),
      `Scene: ${this.scene.length} objects`,
      this.scene.map(o => o.toString()).join('\n')
    ];
    return s.join('\n');
  }

  setShiftVectors() {
    let g_x = Math.tan(0.5 * this.eye.theta);
    let g_y = g_x * this.viewport.m / this.viewport.k;
    this.shiftX = this.eye.b.scale(2 * g_x / (this.viewport.k - 1));
    this.shiftY = this.eye.v.scale(2 * g_y / (this.viewport.m - 1));
    this.p_1m = this.eye.t
      .minus(this.eye.b.scale(g_x))
      .minus(this.eye.v.scale(g_y));
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
    let imageData = canvasUtil.ctx.createImageData(this.viewport.k, this.viewport.m);
    let t0 = (new Date()).getTime();
    for (let i=1; i<=this.viewport.k; i++) {
      for (let j=1; j<=this.viewport.m; j++) {
        let rayDir = this.rayDirection(i, j);
        let color = this.trace(this.eye.e, rayDir);
        let pixelIndex = ((this.viewport.m - j) * this.viewport.k + i) * 4;
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
    this.p0 = p0;             // Vec3D,  point used to define the surface, could be on it or not
    this.colorFn = colorFn;   // Vec3D -> Color
    this.material = material; // Material object
  }

  normalFn(v) {}

  shadeFn(point, rayDir, lights, scene, ambient) {
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

  normalFn(v) {
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

  normalFn(v) {
    return v.minus(this.p0).toUnitVector();
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

  normalFn(v) {
    if (near(v.x, this.xMax)) {
      return vecI;
    } else if (near(v.x, this.xMin)) {
      return negVecI;
    } else if (near(v.y, this.yMax)) {
      return vecJ;
    } else if (near(v.y, this.yMin)) {
      return negVecJ;
    } else if (near(v.z, this.zMax)) {
      return vecK;
    } else if (near(v.z, this.zMin)) {
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
    this.hasTop = hasTop; // TODO -- does this work?
    this.hasBottom = hasBottom;
  }

  normalFn(v) {
    if (near(v.z, this.topZ)) {
      return vecK;
    } else if (near(v.z, this.bottomZ)) {
      return negVecK;
    } else {
      let center = this.p0.projXY();
      let v2d = v.projXY();
      let n = v2d.minus(center);
      return new Vec3D(n.x, n.y, 0);
    }
  }

  rayIntersects(rayBase, rayDir) {
    // a ray R(t) = R0 + t*d intesects cylinder |x-c|^2 = r^2 (c has z=0)
    // project c, R0, d to xy-plane, let v = R0 - c (d is not unit anymore)
    // => r^2 = |R(t) - c|^2 = |R0 + t*d - c| = |v + t*d|^2 = |v|^2 + 2t * v.d + t^2 |d|^2
    // => t^2 + (2 v.d) t + |v|^2 - r^2 = 0
    // => t = (- v.d +/- sqrt((v.d)^2 - |d|^2 (|v|^2 - r^2))) / |d|^2
    let center = this.p0.projXY();
    let base = rayBase.projXY();
    let dir = rayDir.projXY();
    let v = base.minus(center);
    //console.log(`-->c=${center.toString()}; base=${base.toString()}; dir=${dir.toString()}; v=${v.toString()}`);
    let vDotD = v.dot(dir);
    let discriminant = vDotD * vDotD - dir.normSq() * (v.normSq() - this.radius * this.radius);
    //console.log(`-->vDotD=${vDotD.toFixed(5)}; discr=${discriminant.toFixed(5)}`);
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

      if (this.hasTop && (zCyl1 < this.topZ && this.topZ < zCyl2) || (zCyl2 < this.topZ && this.topZ < zCyl1)) {
        // ray passes through the top
        let tTop = (this.topZ - rayBase.z) / rayDir.z;
        ts.push(tTop);
      }

      if (this.hasBottom && (zCyl1 < this.bottomZ && this.bottomZ < zCyl2) || (zCyl2 < this.bottomZ && this.bottomZ < zCyl1)) {
        // ray passes through the top
        let tBottom = (this.bottomZ - rayBase.z) / rayDir.z;
        ts.push(tBottom);
      }

      let t = Math.min(...ts);
      if (t > 0 && t < Number.POSITIVE_INFINITY) {
        return t;
      }
    }
  }

  toString() {
    return `Cylinder: p0 = ${this.p0.toString()}; height = ${this.height}; radius = ${this.radius}}`;
  }
}


class LightSource {
  constructor(position, color) {
    this.pos = position; // Vec3D
    this.color = color; // Vec3D color
  }

  toString() {
    return `pos = ${this.pos.toString()}; color = ${this.color.toString()}`;
  }
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

    let eye = new Eye(negVecI, vecI, vecK, 0.55 * Math.PI * Math.sqrt(WIDTH / HEIGHT));
    canvasUtil.println(`theta = ${0.55 * Math.PI * Math.sqrt(WIDTH / HEIGHT)}`);
    let vp = new Viewport(origin, vecK, HEIGHT, WIDTH);

    let m1 = new Material(1.0, 0.0, 0.0); // no specular effects
    let m2 = new Material(0.75, 0.8, 15);
    let m3 = new Material(0.5, 1.0, 25);

    let pl1 = new Plane(
      new Vec3D(0, 0, -2.75),
      v => (parseInt(Math.round(v.x) + Math.round(v.y)) % 2 == 0) ? blue : lightGray, // checkerboard
      m1,
      vecK
    );

    let pl2 = new Plane(
      new Vec3D(5, 0, 0),
      v => lightGray.minus(purple).scale(0.5 * Math.sin(0.5 * v.z + 0.5 * v.y) + 1).plus(purple),
      m1,
      vecI.scale(-1)
    );

    let sp1 = new Sphere(
      new Vec3D(4, 0.5, -0.25),
      v => (parseInt(Math.round(5 * v.z)) % 2 == 0) ? white : red, // stripes,
      m2,
      1.3
    );

    let sp2 = new Sphere(
      new Vec3D(2.0, -1.2, -1.75),
      v => purple,
      m3,
      0.5
    );

    let box1 = new Box(
      new Vec3D(2.85, 2.95, -3.5),
      v => blueGreen,
      m1,
      new Vec3D(4.05, 3.75, 1.5)
    );

    let box2 = new Box(
      new Vec3D(1.5, -3.0, 1.75),
      v => green,
      m1,
      new Vec3D(5.5, -0.75, 2.5)
    );

    let cyl1 = new VerticalCylinder(
      new Vec3D(4, 0.5, -3.5),
      v => darkGray,
      m2,
      2.5,
      0.57,
      true,
      true
    );

    let cyl2 = new VerticalCylinder(
      new Vec3D(2, -1.2, -2.5),
      v => darkGray,
      m2,
      0.25,
      0.5,
      true,
      true
    );

    let light1 = new LightSource(new Vec3D(-3, 0, 5.25), new Vec3D(0.5, 0.5, 0.2));
    let light2 = new LightSource(new Vec3D(-1, 3, 5), new Vec3D(0.9, 0.81, 0.91));

    let rt = new RayTracer(
      eye,
      vp,
      [pl1, pl2, box1, box2, cyl1, cyl2, sp1, sp2],
      [light1, light2]
    );
    canvasUtil.println(rt.toString());
    rt.draw();
  } else {
    alert('You need a better web browser to see this.');
  }
}
