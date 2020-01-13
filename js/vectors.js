// TODO: fix vector length issues, fix global gravity case, fix sep selection

var canvas;
var ctx;
var WIDTH = 750;
var HEIGHT = 750;
var diag = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT);
var canvasUtil;
var vf; // VectorField
var mousePos = new Vec2D(0, 0);

var M = 4000;
var m = 1;
var G = 1/10;
var grav = 0;
var acc_g = new Vec2D(0.0, -1.0);
var K = 3;

var sep = 50;  // separation of vectors (vertical and horizontal)
var mode = 1;
var away = 1;


class GraphicalVector {
  constructor(p0, p1, vel, color) {
    this.p0 = p0; // Vec2D representing basepoint of segment
    this.p1 = p1; // Vec2D representing endpoint of segment
    this.vel = vel // Vec2D
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
    this.vectors;
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

  initialize() {
    //canvasUtil.println(`initializing VF with sep = ${sep}`);
    this.vectors = new Array(this.numRows);
    for (let i=0; i<this.numRows; i++) {
      this.vectors[i] = new Array(this.numCols);
      for (let j=0; j<this.numCols; j++) {
        let p0 = new Vec2D(sep / 2 + i * sep, sep / 2 + j * sep);
        let p1 = p0.scale(-1 * away * Math.min(sep / p0.norm(), 0.9)).plus(p0);
        let vel = new Vec2D(0.0, 0.0);
        this.vectors[i][j] = new GraphicalVector(p0, p1, vel, "black");
        //canvasUtil.println(`added vector at (${i}, ${j}): ${this.vectors[i][j].p1.toString()}`)
      }
    }
  }

  draw() {
    for (let i=0; i<this.numRows; i++) {
      for (let j=0; j<this.numCols; j++) {
        this.vectors[i][j].draw();
      }
    }
  }

  updateVectors(updateFn) {
    for (let i=0; i<this.numRows; i++) {
      for (let j=0; j<this.numCols; j++) {
        this.vectors[i][j] = updateFn(this.vectors[i][j]);
      }
    }
  }
}


function draw() {
  canvasUtil.clearCanvas();
  let f;
  away = document.getElementById("direction").value;

  if (sep  != document.getElementById("separation").value * 1) {
    //sep = document.getElementById("separation").value * 1;
    //vf.initialize(sep);
  }
  let mode = document.getElementById("style").value * 1;
  switch (mode) {
    case 0:
      f = trackMouse;
      break;
    case 1:
      f = boundedForce;
      break;
    case 2:
      f = gravityLike;
      break;
  }

  vf.updateVectors(f);
  vf.draw();
}

function trackMouse(gv) {
  let dist = gv.p0.distance(mousePos);
  let r = Math.round(255 - 255 * dist / diag);
  let g = 0;
  let b = Math.round(255 * dist / diag);
  let color = Color.colorString(r, g, b);
  // (mouse - p0) * scale_factor + p0
  let p1 = mousePos.minus(gv.p0).scale(away * Math.min(sep / dist, 0.9)).plus(gv.p0);
  return new GraphicalVector(gv.p0, p1, gv.vel, color);
}

function gravityLike(gv) {
  // forces from the mouse and gravity
  let mouseMinusP0 = mousePos.minus(gv.p0);
  let distSq = mouseMinusP0.normSq();
  let dist = Math.sqrt(distSq);
  let acc = mouseMinusP0.scale(away * G * M / distSq);//.plus(acc_g.scale(grav));
  let accNormSq = acc.normSq();
  let vel = acc; //let newVel = gv.vel.plus(acc);
  let p1 = gv.p1.plus(vel); // direction of endpoint

  // project the endpoint onto a sphere around the base point
  p1 = p1.minus(gv.p0).scale(500 / p1.minus(gv.p0).normSq()).plus(gv.p0); // 500???
  let r = Math.round((255 * 2 / Math.PI) * Math.atan(accNormSq));
  let g = 0;
  let b = Math.round(255 - (255 * 2 / Math.PI) * Math.atan(accNormSq));
  var color = Color.colorString(r, g, b);
  return new GraphicalVector(gv.p0, p1, vel, color);
}


function boundedForce(gv) {
  let mouseMinusP0 = mousePos.minus(gv.p0);
  let distSq = mouseMinusP0.normSq();
  let dist = Math.sqrt(distSq);
  let boundSq = K * K * sep * sep;

  if (distSq < boundSq) {
    // forces from the mouse and gravity
    let acc = mouseMinusP0.scale(away * G * M / distSq - 1 / boundSq);
    let vel = gv.vel.plus(acc);
    let p1 = gv.p1.plus(vel); // direction of endpoint

    // project the endpoint onto a sphere around the base point
    p1 = p1.minus(gv.p0).scale(Math.min(0.9 * sep, dist) / p1.minus(gv.p0).norm()).plus(gv.p0);
    let r = Math.round(255 - 255 * distSq / boundSq);
    let g = 0;
    let b = Math.round(255 * distSq / boundSq);
    let color = Color.colorString(r, g, b);
    return new GraphicalVector(gv.p0, p1, vel, color);
  }
  else { // far from mouse, so there is no velocity
    let r = 0;
    let g = 0;
    let b = Math.round(255 * boundSq / distSq);
    let color = Color.colorString(r, g, b);
    return new GraphicalVector(gv.p0, gv.p1, new Vec2D(0, 0), color);
  }
}


function ev_mousemove (ev) {
  const rect = canvas.getBoundingClientRect()
  let mouseX = ev.clientX - rect.left
  let mouseY = ev.clientY - rect.top
  mousePos.x = mouseX;
  mousePos.y = mouseY;
  document.getElementById("x-coord").value = mouseX;
  document.getElementById("y-coord").value = mouseY;
}


function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvas.addEventListener('mousemove', ev_mousemove, false);
    canvasUtil.clearCanvas();
    let n = 33;
    vf = new VectorField(n, n);
    sep = WIDTH / n
    vf.initialize(WIDTH / n);
    //canvasUtil.println(vf.toString());
    vf.draw();
    return setInterval(draw, 10);
  } else {
		alert('You need a better web browser to see this.');
	}
}
