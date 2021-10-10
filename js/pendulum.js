let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let curve; // AnimatedCurve object

// initial conditions of pendulum, in (theta, phi)-space: x = theta, y = phi
let x0 = Math.PI / 4;
let y0 = 0;
let z0 = 0.0;
let w0 = 0.0;

// consts for space-to-screen projection
const PROJ_A = -2.5;
const PROJ_B = 2.5;
const PROJ_C = -2.5;
const PROJ_D = 2.5;

let base = new Point(0, 0); // base point of pendulum, in pendulum (x, y)-space

let length1 = 1;
let length2 = 1;
let grav = 1;

max_speed = 0;

const dT = 0.01;
const MAX_POINTS = 50; //5000;
const BLUE = new Color(0, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);
const BLACK = new Color(0, 0, 0);

function colorFn(i) {
  return Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
}

function draw() {
  if (paused) {
    return 0;
  }

  curve.updatePoints();
  canvasUtil.clearCanvas();
  //let proj = document.parameters.projection.value;
  //curve.projectionFn = spaceToScreen;
  for (let i=0; i < MAX_POINTS-1; i++) {
    let c = curve.colorFn(i);
    let p0 = curve.projectionFn(curve.points[i]);
    let p1 = curve.projectionFn(curve.points[i+1]);
    canvasUtil.drawLine(p0.x, p0.y, p1.x, p1.y, c, 1);
  }
  lastP = curve.projectionFn(curve.points[0]);
  baseP = spaceToScreen(base);
  canvasUtil.drawLine(baseP.x, baseP.y, lastP.x, lastP.y, RED, 1);
  canvasUtil.drawDisk(baseP.x, baseP.y, 3, BLACK);
  canvasUtil.drawDisk(lastP.x, lastP.y, 3, BLACK);
  // debug
  q = curve.projectionFn(curve.points[1]);
  max_speed = Math.max(max_speed, lastP.distance(q) / dT);
  canvasUtil.clearText();
  canvasUtil.println(`max speed = ${max_speed}`);

}

function resetDrawing() {
  max_speed = 0;
  let p0 = new Point4D(
    x0, // + Math.random() * 0.01,
    y0, // + Math.random() * 0.1,
    z0, // + Math.random() * 0.1,
    w0, // + Math.random() * 0.1
  );
  curve = new AnimatedCurve(p0, odeUpdate, angleSpaceToScreen, colorFn);
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.println(`initial position: ${p0.toString()}`);
  //canvasUtil.println(`parameters: sigma = ${SIGMA.toFixed(3)}, rho = ${RHO.toFixed(3)}, beta = ${BETA.toFixed(3)}`);
}

function odeUpdate(p) {
  // 4D system of ODE, approximate solution found using Euler method
  /*
    pendulum eqn: theta'' = -g/l sin theta
    => if phi = theta', then
    theta' = phi
    phi' = theta'' = -g/l sin theta
    for Point object, use x = theta, y = phi
  */

  // TODO: refactor to use point -> point functions for ODE solver

  let dx = p.y;
  let dy = -1 * (grav / length1) * Math.sin(p.x);
  let dz = 0;
  let dw = 0;
  // euler method
  // return new Point4D(p.x + dT * dx, p.y + dT * dy, p.z + dT * dz, p.w + dT * dw);

  let x_half = p.x + 0.5 * dT * dx;
  let y_half = p.y + 0.5 * dT * dy;
  let z_half = p.z + 0.5 * dT * dz;
  let w_half = p.w + 0.5 * dT * dw;

  let dx_half = dx + 0.5 * dT * y_half;
  let dy_half = dy + 0.5 * dT * -1 * (grav / length1) * Math.sin(x_half);
  let dz_half = dz + 0.5 * dT * 0;
  let dw_half = dw + 0.5 * dT * 0;

  // runge-kutta method
  return new Point4D(p.x + dT * dx_half, p.y + dT * dy_half, p.z + dT * dz_half, p.w + dT * dw_half);
}

function pauseDrawing() {
  paused = !paused;
}


function angleSpaceToScreen(p) {
  // transform the pendulum (theta, phi)-space to pendulum (x, y)-space, then to canvas space
  // x = l sin theta
  // y = - l cos theta
  let x = length1 * Math.sin(p.x);
  let y = -1 * length1 * Math.cos(p.x)
  return spaceToScreen(new Point(x, y));
}


function spaceToScreen(p) {
  // transform the pendulum (x, y) space to canvas space
  let px = WIDTH * (p.x - PROJ_A) / (PROJ_B - PROJ_A);
  let py = HEIGHT * (PROJ_D - p.y) / (PROJ_D - PROJ_C); // positive y-axis on canvas points down
  return new Point(px, py);
}

function prepend(a, item) {
  for (let i=a.length-1; i>0; i--) {
    a[i] = a[i-1];
  }
  a[0] = item;
  return a;
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
    resetDrawing();
    return setInterval(draw, 5);
  } else {
    alert('You need a better web browser to see this.');
  }
}
