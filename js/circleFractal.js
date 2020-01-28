const WIDTH = 750;
const HEIGHT = 750;
let canvas;
let ctx;

const MAX_ITER = 10;
const x0 = WIDTH / 2;
const y0 = HEIGHT / 2;
const r0 = WIDTH / 2;
const THETA = Math.PI;
const WHITE = new Color(0, 0, 0);
const BLACK = new Color(255, 255, 255);
let n = 0;
let baseColor;

function getColor(n, step) {
  if (step < Math.pow(2, n-1)) { // gets darker in left half
    return Color.interpolate(baseColor, BLACK, n / MAX_ITER);
  } else { // gets lighter in right half
    return Color.interpolate(baseColor, WHITE, n / MAX_ITER);
  }
}

function refreshData() {
  n = 0;
  baseColor = Color.random();
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.drawDisk(x0, y0, r0, "black"); // black background disk
  this.iterate();
}

function iterate() {
  canvasUtil.println(`iteration ${n}`);
  let numCircles = Math.pow(2, n);
  for (i=0; i<numCircles; i++) { //there are 2^n semicircles drawn at each iteration
    let r = r0 / numCircles;
    let x = x0 - r0 + r + 2 * i * r;
    let clockwise = i % 2 == 1; // clockwise or anticlockwise -- alternate up and down
    ctx.fillStyle = getColor(n, i).toString();
    ctx.beginPath();
    ctx.arc(x, y0, r, 0, THETA, clockwise);
    ctx.closePath();
    ctx.fill();
  }
  n += 1;
}

function init(){
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    refreshData();
  }
  else {
    alert('You need a better web browser to see this.');
  }
}
