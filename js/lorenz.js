let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let solver; // ODESolver object
let solution = [];

const INITIAL_DATA = [1.0, -1.4, 0.6]; // initial data for Lorenz
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3.0;
const TIMESTEP = 0.005;
const MAX_POINTS = 10000;
const BLUE = new Color(0, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);

function pauseDrawing() {
  paused = !paused;
}

function lorenzSystem(x) {
  return new VecND([
    SIGMA * (x.get(1) - x.get(0)),
    x.get(0) * (RHO - x.get(2)) - x.get(1),
    x.get(0) * x.get(1) - BETA * x.get(2)
  ]);
}

function colorFn(i) {
  return Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
}

function spaceToScreenXY(p) {
  // project 3d space onto plane z=0, rescaled to canvas
  let a = -32;
  let b = 32;
  let c = -32;
  let d = 32;

  let px = WIDTH * (p.get(0) - a) / (b - a);
  let py = HEIGHT * (d - p.get(1)) / (d - c);
  return new Point(px, py);
}

function spaceToScreenXZ(p) {
  // project 3d space onto plane y=0, rescaled to canvas
  let a = -32;
  let b = 32;
  let c = 0;
  let d = 64;

  let px = WIDTH * (p.get(0) - a) / (b - a);
  let pz = HEIGHT * (d - p.get(2)) / (d - c);
  return new Point(px, pz);
}

function spaceToScreenYZ(p) {
  // project 3d space onto plane x=0, rescaled to canvas
  let a = -32;
  let b = 32;
  let c = 0;
  let d = 64;

  let py = WIDTH * (p.get(1) - a) / (b - a);
  let pz = HEIGHT * (d - p.get(2)) / (d - c);
  return new Point(py, pz);
}

function draw() {
  if (!paused) {
    let x = solver.update(solution[0]);
    solution = prepend(x, solution);
  }

  canvasUtil.clearCanvas();
  let proj = document.parameters.projection.value;
  let projectionFn = spaceToScreenXY;
  if (proj == "xy") {
    projectionFn = spaceToScreenXY;
  } else if (proj == "xz") {
    projectionFn = spaceToScreenXZ;
  } else if (proj == "yz") {
    projectionFn = spaceToScreenYZ;
  }

  for (let i=0; i < MAX_POINTS-1; i++) {
    let c = colorFn(i);
    let p0 = projectionFn(solution[i]);
    let p1 = projectionFn(solution[i+1]);
    canvasUtil.drawLine(p0.x, p0.y, p1.x, p1.y, c, 1);
  }
  let p = projectionFn(solution[0])
  canvasUtil.drawDisk(p.x, p.y, 3, colorFn(0));
}

function resetDrawing() {
  let noise = new VecND([Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1]);
  let x0 = new VecND(INITIAL_DATA).plus(noise);
  solution = new Array(MAX_POINTS).fill(x0);
  solver = new ODESolver(lorenzSystem, "runge-kutta", TIMESTEP);
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.println(`initial position: ${x0.toString()}`);
  canvasUtil.println(`sigma = ${SIGMA.toFixed(3)}`);
  canvasUtil.println(`rho = ${RHO.toFixed(3)}`);
  canvasUtil.println(`beta = ${BETA.toFixed(3)}`);
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    console.log(WIDTH);
    if (WIDTH <= 750) {
      HEIGHT = WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.5 * document.getElementById("controls").clientHeight);
    }
    console.log(HEIGHT);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    resetDrawing();
    return setInterval(draw, 10);
  } else {
    alert('You need a better web browser to see this.');
  }
}
