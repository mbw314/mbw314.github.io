let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;

let ensemble;

const ANGLE_INCREMENT = 0.0000000001;
const MIRROR_COLOR = Color.colorString(140, 140, 140);
const LASER_COLOR = Color.colorString(200, 0, 0);

class Laser {
  constructor(position, angle, color) {
    this.position = position; // Vec2D
    this.angle = angle; // float
  }

  toString(){
    return `Laser: position=${this.position.toString()}; angle=${this.angle}`;
  }

  direction() {
    return new Vec2D(Math.cos(this.angle), Math.sin(this.angle)); // already a unit vector
  }
}

class Mirror {
  constructor(center, radius, color) {
    this.center = center; // Vec2D
    this.radius = radius; // float
  }

  toString() {
    return `mirror: center=${this.center.toString()}; radius=${this.radius}`;
  }

  draw(text) {
    canvasUtil.drawDisk(this.center.x, this.center.y, this.radius, MIRROR_COLOR);
  }

  tangentVector(p) {
    let v = p.minus(this.center).toUnitVector();
    return new Vec2D(-v.y, v.x); // counterclockwise orientation of tangent line (but it looks reversed on the canvas)
  }
}

class LaserEnsemble {
  constructor(laser, mirrors) {
    this.laser = laser; // Laser
    this.mirrors = mirrors; // array of Mirror objs
    this.points = [];
    this.numHits = 0; // int
  }

  toString(){
    return `Laser: position=${this.position.toString()}; angle=${this.angle}`;
  }

  laserHitsMirror(laserBase, laserDir, mirrorCenter, mirrorRadius) {
    // suppose a ray R(t) = R0 + t*d intesects a circle
    // let v = R0 - c
    // => r^2 = |R(t) - c|^2 = |R0 + t*d - c|^2 = |v + t*d|^2 = |v|^2 + 2t * v.d + t^2 |d|^2
    // => |d|^2 t^2 + (2 v.d) t + |v|^2 - r^2 = a*t^2 + b*t + c = 0
    // t = - v.d +/- sqrt((v.d)^2 - (|v|^2 - r^2))
    let v = laserBase.minus(mirrorCenter);
    let vDotD = v.dot(laserDir);
    let discriminant = vDotD * vDotD - v.normSq() + mirrorRadius * mirrorRadius;
    if (discriminant >= 0.0) {
      let t0 = -1 * vDotD + Math.sqrt(discriminant);
      let t1 = -1 * vDotD - Math.sqrt(discriminant);
      if (Math.min(t0, t1) > 0) {
        return Math.min(t0, t1);
      }
    }
  }

  drawRaySegment(rayBase, rayDir, t) {
    canvasUtil.drawLine(
      rayBase.x,
      rayBase.y,
      rayDir.scale(t).plus(rayBase).x,
      rayDir.scale(t).plus(rayBase).y,
      this.laser.color,
      1
    );
  }

  draw() {
    let points = [];
    [...this.mirrors.entries()].forEach(x => x[1].draw(x[0].toString()));
    canvasUtil.drawDisk(this.laser.position.x, this.laser.position.y, 5, "black");

    let keepDrawing = true;
    this.numHits = 0;
    let laserBase = this.laser.position;
    let laserDir = this.laser.direction();
    let mirrorWithBase = -1; // do not include current mirror in search for intersections
    points.push(laserBase);

    while(keepDrawing) {
      let mirrorIntersectionsPre = [...this.mirrors.entries()]
        .filter(x => x[0] != mirrorWithBase)
        .map(x => [x[0], this.laserHitsMirror(laserBase, laserDir, x[1].center, x[1].radius)])
      let mirrorIntersections = mirrorIntersectionsPre.filter(x => x[1] > 0);
      if (mirrorIntersections.length > 0) {
        this.numHits++;
        mirrorIntersections.sort((a, b) => a[1] - b[1]);
        let mirrorIndex = mirrorIntersections[0][0];
        mirrorWithBase = mirrorIndex;
        let t = mirrorIntersections[0][1];
        laserBase = laserDir.scale(t).plus(laserBase); // update laserBase to point of intersection on mirror
        points.push(laserBase);
        // calculate angle of incidence and use it to create new direction
        let tangent = this.mirrors[mirrorIndex].tangentVector(laserBase);
        let dot = laserDir.dot(tangent); // both are unit vectors
        let angle = -1 * Math.acos(dot);
        laserDir = tangent.rotate(angle);
      } else {
        laserBase = laserDir.scale(Math.max(WIDTH, HEIGHT)).plus(laserBase);
        points.push(laserBase);
        keepDrawing = false;
      }
    }

    if (points.length > 1) {
      for (let i=0; i<points.length-1; i++) {
        canvasUtil.drawLine(points[i].x, points[i].y, points[i+1].x, points[i+1].y, LASER_COLOR, 1);
      }
    }
  }
}


function pauseDrawing() {
  paused = !paused;
}

function refreshDrawing() {
  let mirrors = [];
  let numCols = 9;
  let numRows = 8;
  let mirrorRadius = Math.min(WIDTH, HEIGHT) / 35;
  for (let j=0; j<numCols; j++) {
    for (let i=0; i<numRows; i++) {
      let xOffset = 0.5 * WIDTH / numCols; //i % 2 == 1 ? 0.5 * WIDTH / numCols : 0.0 * WIDTH / numCols; //
      let yOffset = 0.5 * HEIGHT / numRows;//j % 2 == 1 ? 0.5 * HEIGHT / numRows : 0.25 * HEIGHT / numRows;
      mirrors.push(new Mirror(new Vec2D(j * WIDTH / numCols + xOffset, i * HEIGHT / numRows + yOffset), mirrorRadius));
    }
  }

  let laserIndex = parseInt(mirrors.length / 2);
  let laserPosition = mirrors[laserIndex].center;
  mirrors.splice(laserIndex, 1);
  [...mirrors.entries()].forEach(x => x[1].draw());
  let initialAngle = 2 * Math.PI * Math.random();
  let laser = new Laser(laserPosition, initialAngle, LASER_COLOR);
  ensemble = new LaserEnsemble(laser, mirrors);
}

function draw() {
  if (paused) {
    return 0;
  }
  canvasUtil.clearCanvas();
  ensemble.laser.angle += ANGLE_INCREMENT;
  ensemble.draw();
  canvasUtil.clearText();
  canvasUtil.println(`Angle = ${ensemble.laser.angle.toFixed(10)}`);
  canvasUtil.println(`Intersections: ${ensemble.numHits}`);
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    if (WIDTH <= 750) {
      HEIGHT = WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.5 * document.getElementById("controls").clientHeight);
    }
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    refreshDrawing();
    return setInterval(draw, 50);
  } else {
    alert('You need a better web browser to see this.');
  }
}
