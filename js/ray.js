let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
const EPSILON = 0.000001;

class Vec3D extends Point3D {
  constructor(x, y, z) {
    super(x, y, z);
  }

  scale(a) {
    return new Vec3D(a * this.x, a * this.y, a * this.z);
  }

  plus(v) {
    return new Vec3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  times(v) {
    return new Vec3D(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  minus(v) {
    return new Vec3D(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  normSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  norm() {
    return Math.sqrt(this.normSq());
  }

  toUnitVector() {
    return this.scale(1.0 / this.norm());
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    return new Vec3D(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x);
  }
}


class Eye {
  constructor(e, target, viewportUp, theta) { // all vec3d
    this.e = e; // Vec3D, position of 'eye'
    this.t = target.minus(this.e).toUnitVector(); // unit Vec3D, "straight ahead"
    this.b = viewportUp.cross(this.t).toUnitVector(); // unit Vec3D, "right"
    this.v = this.t.cross(this.b).toUnitVector(); // unit Vec3D, "up"
    this.theta = theta; // field of view
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
    this.m = numRows;
    this.k = numCols;
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

class RayTracingEnsemble {
  constructor(eye, viewport, scene, lights) {
    this.eye = eye; // Eye object
    this.viewport = viewport; // Viewport object
    this.scene = scene; // array of SceneObject objects
    this.lights = lights; // for now, array of LightSouce objects
    this.shiftX;
    this.shiftY;
    this.p_1m; // vector in direction from eye to pixel at i=1, j=m
    this.setShiftVectors();
    this.defaultColor = new Vec3D(0, 0, 0); // use a vec3d for float-valued colors
    this.ambientColor = new Vec3D(0.13, 0.15, 0.15); // ambient color
  }

  toString() {
    let s = [
      'RayTracingEnsemble:',
      this.eye.toString(),
      this.viewport.toString(),
      `  shiftX = ${this.shiftY}`,
      `  shiftY = ${this.shiftX}`,
      `  p_1m = ${this.p_1m}`,
      `Lights: ${this.lights.map(x => x.toString())}`,
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
    // currently: can check for intersection of a ray with an object,
    // returning the color of the nearest object to the eye (smallest t value)

    let color = this.defaultColor;
    let nearestObjIndex = -1;
    let tMin = Number.POSITIVE_INFINITY;
    for (let k=0; k<this.scene.length; k++) {
      let t = this.scene[k].rayIntersects(rayBase, rayDir);
      if (t && t < tMin) {
        tMin = t;
        nearestObjIndex = k;
      }
    }
    if (nearestObjIndex > -1) {
      let pt = rayBase.plus(rayDir.scale(tMin));
      // basic version -> no shading:
      //let normal = this.scene[nearestObjIndex].normalFn(pt);
      //color = this.scene[nearestObjIndex].colorFn(pt);

      // more advanced -> some shading:
      color = this.scene[nearestObjIndex].shadeFn(pt, rayDir, this.lights, this.scene, this.ambientColor);
    }
    return color;
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
    canvasUtil.println(`Drawing completed in ${t1 - t0} milliseconds.`);
  }
}

// TODO: use this in each object
class Material {
  constructor(kDiffuse, kSpecular, powSpecular) {
    this.kDiffuse = kDiffuse;
    this.kSpecular = kSpecular;
    this.powSpecular = powSpecular;
  }
}

class SceneObject {
  constructor(centroid, normalFn, colorFn, kDiffuse, kSpecular) {
    this.centroid = centroid; // Vec3D
    this.colorFn = colorFn; // Vec3D -> Color
    this.normalFn = normalFn; // Vec3D -> Vec3D
    this.kDiffuse = kDiffuse;
    this.kSpecular = kSpecular;
    this.specularExp = 15;
  }

  shadeFn(point, rayDir, lights, scene, ambient) {
    let eyeDir = rayDir.scale(-1); // to eye
    let lightContrib = ambient; // will accumulate lighting contributions
    for (let r=0; r<lights.length; r++) {
      let lightVec = lights[r].pos.minus(point); // to light source
      let lightDir = lightVec.toUnitVector();
      let distToLight = lightVec.norm();
      // check to see if path to light is blocked
      let blocked = false;
      for (let k=0; k<scene.length; k++) {
        let t = scene[k].rayIntersects(point, lightDir);
        if (t && EPSILON < t && t < distToLight) { // limit t to avoid shadow acne
          blocked = true;
          k = scene.length; // enough to know that anything is blocking
        }
      }
      if (!blocked) {
        // light = ambient + diffuse (lambertian) + specular (binn-phong)
        let normal = this.normalFn(point);
        let diffuse = lights[r].ill.scale(this.kDiffuse * Math.max(0, normal.dot(lightDir)));
        let h = eyeDir.plus(lightDir).toUnitVector(); // for specularly reflected light
        let specular = lights[r].ill.scale(this.kSpecular * Math.pow(Math.max(0, normal.dot(h)), this.specularExp));
        lightContrib = lightContrib.plus(diffuse).plus(specular);
      }
    }
    return this.colorFn(point).times(lightContrib);
  }

}


class Plane extends SceneObject {
  // given normal n and point p0, point p is on plane iff n.(p-p0)=0
  constructor(centroid, normalFn, colorFn, kDiffuse, kSpecular) {
    super(centroid, normalFn, colorFn, kDiffuse, kSpecular);
  }

  rayIntersects(rayBase, rayDir) {
    // a ray r(t) = r0 + t*d intersects the plane iff n.d != 0:
    // n.p0 = n.r(t0) = n.r0 + t0*n.d
    // =>  t0 = n.(p0-r0) / n.d
    // for the correct direction, we need
    let denom = this.normalFn(this.centroid).dot(rayDir);
    if (denom != 0.0) {
      let t = this.normalFn(this.centroid).dot(this.centroid.minus(rayBase)) / denom;
      if (t > 0) {
        return t;
      }
    }
    return false;
  }

  toString() {
    return `Plane: pt = ${this.centroid}; kDiffuse = ${this.kDiffuse}; kSpecular = ${this.kSpecular}`;
  }

}

class Sphere extends SceneObject {
  constructor(centroid, normalFn, colorFn, kDiffuse, kSpecular, radius) {
    super(centroid, normalFn, colorFn, kDiffuse, kSpecular);
    this.radius = radius;
  }

  toString() {
    return `Sphere: center = ${this.centroid}; kDiffuse = ${this.kDiffuse}; kSpecular = ${this.kSpecular}; radius = ${this.radius}`;
  }

  rayIntersects(rayBase, rayDir) {
    // a ray r(t) = r0 + t*d intesects a sphere
    // v = r0 - c
    // r^2 = |r(t) - c|^2 = |r0 + t*d - c| = |v + t*d|^2 = |v|^2 + 2t * v.d + t^2 |d|^2
    // t^2 + (2 v.d) + |v|^2 - r^2 = 0
    // t = - v.d +/- sqrt((v.d)^2 - (|v|^2 - r^2))
    let v = rayBase.minus(this.centroid);
    let vDotD = v.dot(rayDir);
    let discriminant = vDotD * vDotD - (v.normSq() - this.radius * this.radius);
    if (discriminant >= 0.0) {
      let t0 = -1 * vDotD + Math.sqrt(discriminant);
      let t1 = -1 * vDotD - Math.sqrt(discriminant);
      if (Math.min(t0, t1) > 0) {
        return Math.min(t0, t1);
      }
    }
  }
}


class LightSource {
  constructor(position, illumination) {
    this.pos = position; // Vec3D
    this.ill = illumination; // Vec3D color
  }
  toString() {
    return `pos = ${this.pos.toString()}; illumiation = ${this.ill.toString()}`;
  }
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas();

    let vecI = new Vec3D(1, 0, 0);
    let vecJ = new Vec3D(0, 1, 0);
    let vecK = new Vec3D(0, 0, 1);
    // canvasUtil.println(`i x j = ${vecI.cross(vecJ).toString()}`);
    // canvasUtil.println(`j x k = ${vecJ.cross(vecK).toString()}`);

    let viewportUp = new Vec3D(0, 0, 1);
    let viewportCenter = new Vec3D(0, 0, 0);
    let eyePos = new Vec3D(-1, 0, 0);
    let eyeTarget = viewportCenter.minus(eyePos);
    let eye = new Eye(eyePos, eyeTarget, viewportUp, 0.55 * Math.PI);
    //canvasUtil.println(eye.toString());
    let m = 750;
    let k = 750;
    let vp = new Viewport(viewportCenter, viewportUp, m, k);
    //canvasUtil.println(vp.toString());

    let gray = new Vec3D(100 / 256, 100 / 256, 100 / 256);
    let purple = new Vec3D(1, 0, 1);
    let blue = new Vec3D(0, 0, 1);
    let white = new Vec3D(1, 1, 1);
    let pl1 = new Plane(
      new Vec3D(0, 0, -0.75),
      v => vecK,
      v => (parseInt(Math.round(v.x) + Math.round(v.y)) % 2 == 0) ? blue : white, // checkerboard
      0.87,
      0.5
    );
    canvasUtil.println(pl1.toString());

    let pl2 = new Plane(
      new Vec3D(5, 0, 0),
      v => vecI.scale(-1),
      v => (parseInt(Math.round(v.y) + Math.round(v.z)) % 2 == 0) ? gray : purple, // checkerboard
      0.95,
      0.9
    );

    let green = new Vec3D(0, 1, 0);
    let red = new Vec3D(1, 0, 0);
    let c1 = new Vec3D(2, 0, -0.25);
    let sp1 = new Sphere(
      c1,
      v => v.minus(c1).toUnitVector(),
      v => green,
      0.75,
      0.6,
      1.0
    );
    let c2 = new Vec3D(2, 0, 1.25);
    let sp2 = new Sphere(
      c2,
      v => v.minus(c2).toUnitVector(),
      v => blue,
      0.75,
      0.9,
      0.75
    );

    let light1 = new LightSource(new Vec3D(2, -8, 15), white);
    let light2 = new LightSource(new Vec3D(2, 3, 10), new Vec3D(0.21, 0.21, 0.21));

    let rte = new RayTracingEnsemble(eye, vp, [pl1, pl2, sp1, sp2], [light1, light2]);
    canvasUtil.println(rte.toString());
    rte.draw();
  } else {
    alert('You need a better web browser to see this.');
  }
}
