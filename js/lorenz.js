let WIDTH = 750;
let HEIGHT = 750;
let canvas;
let ctx;
let canvasUtil;
let paused = false;
let curve; // ParametrizedCurve object

let x0 = 1.0;
let y0 = -1.4;
let z0 = 0.6;
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3.0;
const T = 0.01;
const MAX_POINTS = 5000;
const BLUE = new Color(0, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);

function colorFn(i) {
  return Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
}

function draw() {
  if (paused) {
    return 0;
  }

  curve.updatePoints();
  canvasUtil.clearCanvas();
  let proj = document.parameters.projection.value;
  if (proj == "xy") {
    curve.projectionFn = spaceToScreenXY;
  } else if (proj == "xz") {
    curve.projectionFn = spaceToScreenXZ;
  } else if (proj == "yz") {
    curve.projectionFn = spaceToScreenYZ;
  }
  for (let i=0; i < MAX_POINTS-1; i++) {
    let c = curve.colorFn(i);
    let p0 = curve.projectionFn(curve.points[i]);
    let p1 = curve.projectionFn(curve.points[i+1]);
    canvasUtil.drawLine(p0.x, p0.y, p1.x, p1.y, c, 1);
  }
}

function resetDrawing() {
  let p0 = new Point3D(
    x0 + Math.random() * 0.1,
    y0 + Math.random() * 0.1,
    z0 + Math.random() * 0.1);
  curve = new ParametrizedCurve(p0, lorenzUpdate, spaceToScreenXY, colorFn);
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.println(`initial position: (${p0.x.toFixed(3)}, ${p0.y.toFixed(3)}, ${p0.z.toFixed(3)})`);
  canvasUtil.println(`parameters: sigma = ${SIGMA.toFixed(3)}, rho = ${RHO.toFixed(3)}, beta = ${BETA.toFixed(3)}`);
}

function lorenzUpdate(p) {
  let dx = SIGMA * (p.y - p.x);
  let dy = p.x * (RHO - p.z) - p.y;
  let dz = p.x * p.y - BETA * p.z;
  return new Point3D(p.x + T * dx, p.y + T * dy, p.z + T * dz);
}

function pauseDrawing() {
  paused = !paused;
}

function spaceToScreenXY(p) {
  // project 3d space onto plane z=0, rescaled to canvas
  let a = -32;
  let b = 32;
  let c = -32;
  let d = 32;

  let px = WIDTH * (p.x - a) / (b - a);
  let py = HEIGHT * (d - p.y) / (d - c);
  return new Point(px, py);
}

function spaceToScreenXZ(p) {
  // project 3d space onto plane y=0, rescaled to canvas
  let a = -32;
  let b = 32;
  let c = 0;
  let d = 64;

  let px = WIDTH * (p.x - a) / (b - a);
  let pz = HEIGHT * (d - p.z) / (d - c);
  return new Point(px, pz);
}

function spaceToScreenYZ(p) {
  // project 3d space onto plane x=0, rescaled to canvas
  let a = -32;
  let b = 32;
  let c = 0;
  let d = 64;

  let py = WIDTH * (p.y - a) / (b - a);
  let pz = HEIGHT * (d - p.z) / (d - c);
  return new Point(py, pz);
}

function prepend(a, item) {
  for (let i=a.length-1; i>0; i--) {
    a[i] = a[i-1];
  }
  a[0] = item;
  return a;
}

function init(adjustSize) {
  canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    resetDrawing();
    return setInterval(draw, 50);
  } else {
    alert('You need a better web browser to see this.');
  }
}
