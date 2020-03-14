let WIDTH = 750;
let HEIGHT = 750;
let DIAG = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT);
const NUM_ROWS = 30;
const NUM_COLS = 30;
let canvasUtil;
let vf; // VectorField
let mousePos = new Vec2D(0, 0);

const GRAV_CONST = 10000; // m * M * G
let accGrav = new Vec2D(0.0, -9.8);
let K = 3;
let away = 1;


class GraphicalVector {
  constructor(p0, p1, vel, color) {
    this.p0 = p0; // Vec2D representing basepoint of segment
    this.p1 = p1; // Vec2D representing endpoint of segment
    this.vel = vel // Vec2D representing velocity, for dynamics
    this.color = color;
  }

  draw () {
    // line segment for the vector, with small circle at base
    canvasUtil.drawLine(this.p0.x, this.p0.y, this.p1.x, this.p1.y, this.color, 1);
    canvasUtil.drawCircle(this.p0.x, this.p0.y, 2, this.color, 1);
  }
}

class VectorField {
  constructor(numRows, numCols) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.vectors = []; // array of GraphicalVector objects
    this.sep = 0;
    this.updateFn;
  }

  toString() {
    let s = "";
    for (let i=0; i<this.numRows; i++) {
      for (let j=0; j<this.numCols; j++) {
        s += this.vectors[i][j].p0.toString() + "->" + this.vectors[i][j].p1.toString() + '\n';
      }
    }
    return s;
  }

  initialize(canvasWidth, canvasHeight) {
    this.sep = Math.min(canvasWidth / (this.numCols + 1), canvasHeight / (this.numRows + 1));
    let xMax = (this.numCols - 1) * this.sep;
    let yMax = (this.numRows - 1) * this.sep;
    let x0 = (canvasWidth - xMax) / 2;
    let y0 = (canvasHeight - yMax) / 2;

    this.vectors = new Array(this.numRows);
    for (let i=0; i<this.numCols; i++) {
      for (let j=0; j<this.numRows; j++) {
        let p0 = new Vec2D(i * this.sep + x0, j * this.sep + y0);
        let p1 = p0.plus(new Vec2D(0.9 * this.sep, 0));
        let vel = new Vec2D(0.0, 0.0);
        this.vectors.push(new GraphicalVector(p0, p1, vel, "black"));
      }
    }
  }

  draw() {
    this.vectors.forEach(v => v.draw());
  }

  updateVectors() {
    this.vectors = this.vectors.map(v => this.updateFn(v));
  }

  trackMouse(gv) {
    let r = Math.round(255 - 255 * mousePos.y / HEIGHT);
    let g = 0;
    let b = Math.round(255 * mousePos.x / WIDTH);
    let color = Color.colorString(r, g, b);
    // p1 = (mouse - p0) * length + p0
    let length = 0.85 * Math.min(this.sep, gv.p0.minus(mousePos).norm());
    let p1 = mousePos.minus(gv.p0).toUnitVector().scale(away * length).plus(gv.p0);
    return new GraphicalVector(gv.p0, p1, gv.vel, color);
  }

  gravityLike(gv) {
    // forces from the mouse and gravity
    let mouseMinusP0 = mousePos.minus(gv.p0);
    let distSq = mouseMinusP0.normSq();
    let dist = Math.sqrt(distSq);
    let acc = mouseMinusP0.scale(away * GRAV_CONST / Math.pow(distSq, 1.5));
    let accNormSq = acc.normSq();
    let vel = acc.plus(gv.vel);
    let dir = gv.p1.plus(vel).minus(gv.p0).toUnitVector(); // direction of endpoint
    let length = 0.85 * Math.min(this.sep, dist);
    let p1 = dir.scale(length).plus(gv.p0);
    let r = Math.round((255 * 2 / Math.PI) * Math.atan(accNormSq));
    let g = 0;
    let b = Math.round(255 - (255 * 2 / Math.PI) * Math.atan(accNormSq));
    let color = Color.colorString(r, g, b);
    return new GraphicalVector(gv.p0, p1, vel, color);
  }


  boundedForce(gv) {
    let mouseMinusP0 = mousePos.minus(gv.p0);
    let distSq = mouseMinusP0.normSq();
    let dist = Math.sqrt(distSq);
    let boundSq = K * K * this.sep * this.sep;
    let b = Math.round(255 * distSq / boundSq);

    if (distSq < boundSq) {
      // forces from the mouse and gravity
      let acc = mouseMinusP0.scale(away * GRAV_CONST / Math.pow(distSq, 1.5) - 1 / boundSq);
      let vel = gv.vel.plus(acc);
      let dir = gv.p1.plus(vel).minus(gv.p0).toUnitVector(); // direction of endpoint
      let length = 0.85 * Math.min(this.sep, dist);
      let p1 = dir.scale(length).plus(gv.p0);
      let color = Color.colorString(Math.round(255 - 255 * distSq / boundSq), 0, b);
      return new GraphicalVector(gv.p0, p1, vel, color);
    }
    else { // far from mouse, so there is no force
      let color = Color.colorString(0, 0, b);
      return new GraphicalVector(gv.p0, gv.p1, new Vec2D(0, 0), color);
    }
  }
}


function draw() {
  canvasUtil.clearCanvas();
  away = document.getElementById("direction").value;
  let mode = parseInt(document.getElementById("style").value);
  switch (mode) {
    case 0:
      vf.updateFn = vf.trackMouse;
      break;
    case 1:
      vf.updateFn = vf.boundedForce;
      break;
    case 2:
      vf.updateFn = vf.gravityLike;
      break;
  }
  vf.updateVectors();
  vf.draw();
}

function ev_mousemove (ev) {
  const rect = canvas.getBoundingClientRect()
  let mouseX = ev.clientX - rect.left
  let mouseY = ev.clientY - rect.top
  mousePos.x = mouseX;
  mousePos.y = mouseY;
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
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    canvas.addEventListener('mousemove', ev_mousemove, false);
    canvasUtil.clearCanvas();
    vf = new VectorField(parseInt(HEIGHT / 25), parseInt(WIDTH / 25));
    vf.initialize(WIDTH, HEIGHT);
    return setInterval(draw, 10);
  } else {
		alert('You need a better web browser to see this.');
	}
}
