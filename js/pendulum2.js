let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let canvasUtil2;
let paused = false;
let solver; // ODESolver object
let solution = [];
let speedCurve1 = [];
let speedCurve2 = [];

// initial conditions of pendulum, in (phi1, omega1, phi2, omega2)-space
const INITIAL_DATA = [Math.PI / 4, 0.01, Math.PI / 8, -0.1];

// consts for space-to-screen projection
const PROJ_A = -2.5;
const PROJ_B = 2.5;
const PROJ_C = -2.5;
const PROJ_D = 2.5;

let BASE = new VecND([0, 0]); // base point of pendulum, in pendulum (x, y)-space

let length1 = 1.3;
let mass1 = 1.4;
let length2 = 0.9;
let mass2 = 1.1;
let grav = 10;

const TIMESTEP = 0.01;
const MAX_POINTS = 150;
const MAX_CURVE_POINTS = 500;
const BLUE = new Color(0, 0, 255);
const PURPLE = new Color(255, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);
const BLACK = new Color(0, 0, 0);

function pauseDrawing() {
  paused = !paused;
}

function doublePendulumSystem(x) {
  // x = [phi1, omega1, phi2, omega2]

  let phi1 = x.get(0);
  let omega1 = x.get(1);
  let phi2 = x.get(2);
  let omega2 = x.get(3);

  let mu = 1 + mass1 / mass2;
  let a11 = mu;
  let a12 = Math.cos(phi1 - phi2);
  let a22 = 1;
  let b1 = mu * grav * length1 * Math.sin(phi1) + length2 * Math.sin(phi1 - phi2) * omega2 * omega2;
  let b2 = grav * length2 * Math.sin(phi2) - length1 * Math.sin(phi1 - phi2) * omega1 * omega1;

  return new VecND([
    omega1,  // phi1'
    (b2 * a12 - b1 * a22) / (a11 * a22 - a12 * a12) * (1 / length1),   // omega1'
    omega2, // phi2'
    (b1 * a12 - b2 * a11) / (a11 * a22 - a12 * a12) * (1 / length2)  // omega2'
  ]);
}

function colorFn1(i) {
  return Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
}

function colorFn2(i) {
  return Color.interpolate(PURPLE, WHITE, i / MAX_POINTS);
}

function angleSpaceToScreen(x) {
  // transform the pendulum (phi1, omega1, phi2, omega2)-space to pendulum (x1, y1, x2, y2)-space, then to canvas space
  // x = l sin theta
  // y = - l cos theta
  let x1 = length1 * Math.sin(x.get(0));
  let y1 = -1 * length1 * Math.cos(x.get(0));
  let x2 = x1 + length2 * Math.sin(x.get(2));
  let y2 = y1 + -1 * length2 * Math.cos(x.get(2));
  let p1 = spaceToScreen(new VecND([x1, y1]));
  let p2 = spaceToScreen(new VecND([x2, y2]));
  return new PointND([p1.x, p1.y, p2.x, p2.y]);
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
    let c1 = colorFn1(i);
    let c2 = colorFn2(i);
    let p0 = projectionFn(solution[i]);
    let p1 = projectionFn(solution[i+1]);
    canvasUtil.drawLine(p0.get(0), p0.get(1), p1.get(0), p1.get(1), c1, 1);
    canvasUtil.drawLine(p0.get(2), p0.get(3), p1.get(2), p1.get(3), c2, 1);
  }

  // draw the moving pendulum endpoint
  let p = projectionFn(solution[0]);

  let basePt = spaceToScreen(BASE);
  let endPt1 = new Point(p.get(0), p.get(1));
  let endPt2 = new Point(p.get(2), p.get(3));

  canvasUtil.drawLine(basePt.x, basePt.y, endPt1.x, endPt1.y, RED, 1);
  canvasUtil.drawLine(endPt1.x, endPt1.y, endPt2.x, endPt2.y, RED, 1);
  canvasUtil.drawDisk(basePt.x, basePt.y, 3, BLACK);
  canvasUtil.drawDisk(endPt1.x, endPt1.y, 3, BLACK);
  canvasUtil.drawDisk(endPt2.x, endPt2.y, 3, BLACK);

  let q = projectionFn(solution[1]);
  let prevEndPt1 = new Point(q.get(0), q.get(1));
  let prevEndPt2 = new Point(q.get(2), q.get(3));
  // max_speed = Math.max(max_speed, p.distance(q) / TIMESTEP);
  let speed1 = endPt1.distance(prevEndPt1) / TIMESTEP;
  speedCurve1 = prepend(speed1, speedCurve1);
  plotCurve(speedCurve1, canvasUtil2);

  let speed2 = endPt2.distance(prevEndPt2) / TIMESTEP;
  speedCurve2 = prepend(speed2, speedCurve2);
  plotCurve(speedCurve2, canvasUtil3);

  // canvasUtil.clearText();
  // canvasUtil.println(`max speed = ${max_speed}`);
}

function resetDrawing() {
  let noise = new VecND([Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1]);
  let x0 = new VecND(INITIAL_DATA).plus(noise);
  solution = new Array(MAX_POINTS).fill(x0);
  solver = new ODESolver(doublePendulumSystem, "runge-kutta", TIMESTEP);
  speedCurve1 = new Array(MAX_CURVE_POINTS).fill(0);
  speedCurve2 = new Array(MAX_CURVE_POINTS).fill(0);
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.println(`initial position: ${x0.toString()}`);
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

  let canvas2 = document.getElementById("canvas2");
  let canvas3 = document.getElementById("canvas3");
  // canvas.width = WIDTH;
  // canvas.height = HEIGHT;

  if (canvas.getContext && canvas2.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    resetDrawing();

    console.log("init canvas1");

    let ctx2 = canvas2.getContext('2d');
    canvasUtil2 = new CanvasUtil(ctx2, canvas2.width, canvas2.height); //, document.outform.output);
    console.log("init canvas2");

    let ctx3 = canvas3.getContext('2d');
    canvasUtil3 = new CanvasUtil(ctx3, canvas3.width, canvas3.height); //, document.outform.output);
    console.log("init canvas3");


    return setInterval(draw, 11);
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
