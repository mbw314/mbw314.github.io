const WIDTH = 750;
const HEIGHT = 750;
let canvas;
let ctx;
let canvasUtil;
let paused = false;

let x0 = 1.0;
let y0 = -1.4;
let z0 = 0.6;
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3.0;
const T = 0.01;
const MAX_POINTS = 5000;
let points;// array of 2d points to draw
var x;
var y;
var z;
const BLUE = new Color(0, 0, 255);
const RED = new Color(255, 0, 0);
const WHITE = new Color(255, 255, 255);


function resetDrawing() {
  let x0 = 1.0 + Math.random() * 0.1;
  let y0 = -1.4 + Math.random() * 0.1;;
  let z0 = 0.6 + Math.random() * 0.1;;
  points = new Array(MAX_POINTS).fill(spaceToScreen(x0, y0, z0));
  [x, y, z] = lorenzUpdate(x0, y0, z0);
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.println(`initial position: (${x0.toFixed(3)}, ${y0.toFixed(3)}, ${z0.toFixed(3)})`);
  canvasUtil.println(`parameters: sigma = ${SIGMA.toFixed(3)}, rho = ${RHO.toFixed(3)}, beta = ${BETA.toFixed(3)}`);
}

function lorenzUpdate(x, y, z) {
  let dx = SIGMA * (y - x);
  let dy = x * (RHO - z) - y;
  let dz = x * y - BETA * z;
  return [x + T * dx, y + T * dy, z + T * dz];
}

function pauseDrawing() {
  paused = !paused;
}

function spaceToScreen(x, y, z) {
  // project 3d space onto plane z=0;
  let a = -32;
  let b = 32;
  let c = -32;
  let d = 32;

  let px = WIDTH * (x - a) / (b - a);
  let py = HEIGHT * (d - y) / (d - c);
  return [px, py];
}

function draw() {
  if (paused) {
    return 0;
  }

  [x1, y1, z1] = lorenzUpdate(x, y, z);
  let p0 = spaceToScreen(x, y, z);
  let p1 = spaceToScreen(x1, y1, z1);
  points = prepend(points, [p1[0], p1[1]]);
  canvasUtil.clearCanvas();
  for (let i=0; i < MAX_POINTS-1; i++) {
    let c = Color.interpolate(BLUE, WHITE, i / MAX_POINTS);
    canvasUtil.drawLine(points[i][0], points[i][1], points[i+1][0], points[i+1][1], c, 1);
  }

  x = x1;
  y = y1;
  z = z1;
}

function prepend(a, item) {
  for (let i=a.length-1; i>0; i--) {
    a[i] = a[i-1];
  }
  a[0] = item;
  return a;
}


function init() {
  canvas = document.getElementById("canvas");
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
