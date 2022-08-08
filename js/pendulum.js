let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let canvasUtil2;
let canvasUtil3;
let paused = false;
let solver; // ODESolver object
let solution = [];
let speedCurve = [];
let energyCurve = []

// initial conditions of pendulum, in (theta, phi)-space: x = theta, y = phi
const INITIAL_DATA = [Math.PI / 4, 0.0, 0.0, 0.0];

// consts for space-to-screen projection
const PROJ_A = -2.5;
const PROJ_B = 2.5;
const PROJ_C = -2.5;
const PROJ_D = 2.5;

let BASE = new VecND([0, 0]); // base point of pendulum, in pendulum (x, y)-space

let length = 1;
let grav = 9.8;

// const INITIAL_DATA = [1.0, -1.4, 0.6]; // initial data for Lorenz
const TIMESTEP = 0.01;
const MAX_POINTS = 50;
const MAX_CURVE_POINTS = 500;
const BLUE = new Color(0, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);
const BLACK = new Color(0, 0, 0);

function pauseDrawing() {
  paused = !paused;
}

function pendulumSystem(x) {
  /*
  //     pendulum eqn: phi'' = -g/l sin(phi)
  //     => if omega = phi', then
  //     phi' = omega
  //     omega' = phi'' = -g/l sin(phi)
  //     for Point object, use x = phi, y = omega
  //   */
  //   let dx = p.y;
  //   let dy = -1 * (grav / length) * Math.sin(p.x);
  //   let dz = 0;
  //   let dw = 0;

  let phi = x.get(0);
  let omega = x.get(1);
  return new VecND([
    omega,  // phi'
    -1 * (grav / length) * Math.sin(phi),  // omega'
  ]);
}

function colorFn(i) {
  return Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
}

function angleSpaceToScreen(x) {
  // transform the pendulum (phi, omega)-space to pendulum (x, y)-space, then to canvas space
  // x = l sin(phi)
  // y = - l cos(phi)
  let a = length * Math.sin(x.get(0));
  let b = -1 * length * Math.cos(x.get(0));
  return spaceToScreen(new VecND([a, b]));
}


function spaceToScreen(p) {
  // transform the pendulum (x, y) space to canvas space
  let px = WIDTH * (p.get(0) - PROJ_A) / (PROJ_B - PROJ_A);
  let py = HEIGHT * (PROJ_D - p.get(1)) / (PROJ_D - PROJ_C); // positive y-axis on canvas points down
  return new Point(px, py);
}

function draw() {
  if (paused) {
    return 0
  }

  let x = solver.update(solution[0]);
  solution = prepend(x, solution);

  canvasUtil.clearCanvas();

  let projectionFn = angleSpaceToScreen;

  for (let i=0; i < MAX_POINTS-1; i++) {
    let c = colorFn(i);
    let p0 = projectionFn(solution[i]);
    let p1 = projectionFn(solution[i+1]);
    canvasUtil.drawLine(p0.x, p0.y, p1.x, p1.y, c, 1);
  }

  // draw the moving pendulum endpoint
  let p = projectionFn(solution[0])
  //canvasUtil.drawDisk(p.x, p.y, 3, colorFn(0));

  let baseP = spaceToScreen(BASE);
  canvasUtil.drawLine(baseP.x, baseP.y, p.x, p.y, RED, 1);
  canvasUtil.drawDisk(baseP.x, baseP.y, 3, BLACK);
  canvasUtil.drawDisk(p.x, p.y, 3, BLACK);
  // debug
  let q = projectionFn(solution[1])
  //max_speed = Math.max(max_speed, p.distance(q) / TIMESTEP);


  canvasUtil.clearText();
  // canvasUtil.println(`max speed = ${max_speed}`);

  // energy
  let energy = grav * Math.cos(solution[0].get(0));
  energyCurve = prepend(energy, energyCurve);
  canvasUtil2.clearCanvas();
  plotCurve(energyCurve, canvasUtil2);

  // speed
  let speed = p.distance(q) / TIMESTEP;
  speedCurve = prepend(speed, speedCurve);
  canvasUtil3.clearCanvas();
  plotCurve(speedCurve, canvasUtil3);
}

function resetDrawing() {
  let noise = new VecND([Math.random() * 0.1, 0]);
  let x0 = new VecND(INITIAL_DATA).plus(noise);
  solution = new Array(MAX_POINTS).fill(x0);
  method = "runge-kutta";
  solver = new ODESolver(pendulumSystem, method, TIMESTEP);
  speedCurve = new Array(MAX_CURVE_POINTS).fill(0);
  energyCurve = new Array(MAX_CURVE_POINTS).fill(0);
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.println(`initial position: ${x0.toString()}`);
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  // if (parseInt(adjustSize) > 0) {
  //   WIDTH = document.getElementById("controls").clientWidth;
  //   console.log(WIDTH);
  //   if (WIDTH <= 750) {
  //     HEIGHT = WIDTH;
  //   } else {
  //     HEIGHT = window.innerHeight - parseInt(1.5 * document.getElementById("controls").clientHeight);
  //   }
  //   console.log(HEIGHT);
  // }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let canvas2 = document.getElementById("canvas2");
  let canvas3 = document.getElementById("canvas3");
  // canvas.width = WIDTH;
  // canvas.height = HEIGHT;

  if (canvas.getContext && canvas2.getContext && canvas3.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    resetDrawing();

    console.log("init canvas1");

    let ctx2 = canvas2.getContext('2d');
    canvasUtil2 = new CanvasUtil(ctx2, canvas2.width, canvas2.height); //, document.outform.output);
    console.log("init canvas2");

    let ctx3 = canvas3.getContext('2d');
    canvasUtil3 = new CanvasUtil(ctx3, canvas3.width, canvas2.height); //, document.outform.output);
    console.log("init canvas3");
    //return setInterval(draw, 10);
    // canvasUtil2.clearCanvas();
    // let b = 1
    // let ys = [-1 + b, 1 + b, -2 + b, 2 + b, -3 + b, 3 + b];
    // plotCurve(ys);

    return setInterval(draw, 10);
  } else {
    alert('You need a better web browser to see this.');
  }
}


function curveSpaceToScreen(p, xMin, xMax, yMin, yMax) {
  // transform the curve (x, y) space to canvas space
  let px = canvasUtil2.width * (p.x - xMin) / (xMax - xMin);
  let py = canvasUtil2.height * (yMax - p.y) / (yMax - yMin); // positive y-axis on canvas points down
  return new Point(px, py);
}

function plotCurve(ys, canvasUtility) {
  canvasUtility.clearCanvas();
  // ys is an array of floats with latest value first, length = n
  // transform to (-n+1, ys[-n+1]), ..., (-1, ys[1]), (0, ys[0]))
  let xMin0 = -1 * ys.length + 1;
  let xMax0 = 0;
  let yMin0 = Math.min(...ys, 0);
  let yMax0 = Math.max(...ys, 0);
  let xPadding = 0.1 * ys.length; //canvasUtil2.width;
  let yPadding = 0.1 * (yMax0 - yMin0);
  let xMin = xMin0 - xPadding;
  let xMax = xMax0 + xPadding;
  let yMin = yMin0 - yPadding;
  let yMax = yMax0 + yPadding;

  // axes
  let xAxisMin = curveSpaceToScreen(new Point(0, yMin), xMin, xMax, yMin, yMax);
  let xAxisMax = curveSpaceToScreen(new Point(0, yMax), xMin, xMax, yMin, yMax);
  let yAxisMin = curveSpaceToScreen(new Point(xMin, 0), xMin, xMax, yMin, yMax);
  let yAxisMax = curveSpaceToScreen(new Point(xMax, 0), xMin, xMax, yMin, yMax);
  canvasUtility.drawLine(xAxisMin.x, xAxisMin.y, xAxisMax.x, xAxisMax.y, "grey", 1);
  canvasUtility.drawLine(yAxisMin.x, yAxisMin.y, yAxisMax.x, yAxisMax.y, "grey", 1);

  // labels
  let yMinLabel = curveSpaceToScreen(new Point(xMax0 + xPadding/3, Math.min(...ys)), xMin, xMax, yMin, yMax);
  canvasUtility.drawText(
    Math.min(...ys).toFixed(2),
    yMinLabel.x,
    yMinLabel.y,
    10
  );
  let yMaxLabel = curveSpaceToScreen(new Point(xMax0 + xPadding/3, Math.max(...ys)), xMin, xMax, yMin, yMax);
  canvasUtility.drawText(
    Math.max(...ys).toFixed(2),
    yMaxLabel.x,
    yMaxLabel.y,
    10
  );

  let pts = [...ys.entries()].map(z => new Point(-z[0], z[1]))
    .map(p => curveSpaceToScreen(p, xMin, xMax, yMin, yMax));

  for (let i=0; i<pts.length-1; i++) {
    canvasUtility.drawLine(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, "black", 1);
  }

  return pts;
}
