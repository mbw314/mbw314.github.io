let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let solver; // ODESolver object
let solution = [];

const INITIAL_DATA = [1.0, 0.0];

const TIMESTEP = 0.01;
const MAX_POINTS = parseInt(2 * Math.PI * (1 / TIMESTEP * 10));
const BLUE = new Color(0, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);

function pauseDrawing() {
  paused = !paused;
}

function testSystem(x) {
  return new VecND([
    x.get(1) - 0.3 * x.get(0),
    -1 * x.get(0)
  ]);
}

function colorFn(i) {
  return Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
}

function spaceToScreenXY(p) {
  // project 3d space onto plane z=0, rescaled to canvas
  let a = -2;
  let b = 2;
  let c = -2;
  let d = 2;

  let s = Math.min(HEIGHT, WIDTH);
  let px = s * (p.get(0) - a) / (b - a);
  let py = s * (d - p.get(1)) / (d - c);
  return new Point(px, py);
}

function draw() {

  canvasUtil.clearCanvas();
  //let proj = document.parameters.projection.value;
  let projectionFn = spaceToScreenXY;

  if (!paused) {
    let x = solver.update(solution[0]);
    solution = prepend(x, solution);
    // let p = projectionFn(solution[0])
    // console.log(`${solution[0]} -> ${p}`);
  }

  for (let i=0; i < MAX_POINTS-1; i++) {
    let c = colorFn(i);
    let p0 = projectionFn(solution[i]);
    let p1 = projectionFn(solution[i+1]);
    canvasUtil.drawLine(p0.x, p0.y, p1.x, p1.y, c, 1);
  }
  let p = projectionFn(solution[0])
  // console.log(`${solution[0]} -> ${p}`);
  canvasUtil.drawDisk(p.x, p.y, 3, colorFn(0));
  console.log(`radius = ${solution[1].norm()}`);
}

function resetDrawing() {
  // let noise = new VecND([Math.random() * 0.1, Math.random() * 0.1]);
  // let x0 = new VecND(INITIAL_DATA).plus(noise);
  let x0 = new VecND(INITIAL_DATA)
  solution = new Array(MAX_POINTS).fill(x0);
  solver = new ODESolver(testSystem, "runge-kutta", TIMESTEP); // "runge-kutta");
  canvasUtil.clearCanvas();
  canvasUtil.clearText();

  //
  // // pre-solve it for N steps, then draw static image
  // for (let i=0; i<MAX_POINTS; i++) {
  //   let x = solver.update(solution[0]);
  //   solution = prepend(x, solution);
  // }
  //
  // for (let i=0; i < MAX_POINTS-1; i++) {
  //   let c = colorFn(i);
  //   let p0 = spaceToScreenXY(solution[i]);
  //   let p1 = spaceToScreenXY(solution[i+1]);
  //   canvasUtil.drawLine(p0.x, p0.y, p1.x, p1.y, c, 1);
  // }
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
    // return setInterval(draw, 1);
  } else {
    alert('You need a better web browser to see this.');
  }
}
