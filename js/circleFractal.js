let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;

const MAX_ITER = 10;
let x0 = WIDTH / 2;
let y0 = HEIGHT / 2;
let r0 = WIDTH / 2;
const THETA = Math.PI;
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(255, 255, 255);
let circleFractal; // CircleFractal object

class CircleFractal {
  constructor(baseColor) {
    this.baseColor = baseColor; // Color object
    this.iteration = 0;
  }

  getColor(step) {
    if (step < Math.pow(2, this.iteration-1)) {
      return Color.interpolate(this.baseColor, WHITE, this.iteration / MAX_ITER);
    } else {
      return Color.interpolate(this.baseColor, BLACK, this.iteration / MAX_ITER);
    }
  }

  iterateAndDraw() {
    let numCircles = Math.pow(2, this.iteration);
    for (let i=0; i<numCircles; i++) { //there are 2^n semicircles drawn at each iteration
      let r = r0 / numCircles;
      let x = x0 - r0 + (2 * i + 1) * r;
      let clockwise = i % 2 == 1; // clockwise or anticlockwise -- alternate up and down
      canvasUtil.ctx.fillStyle = this.getColor(i).toString();
      canvasUtil.ctx.beginPath();
      canvasUtil.ctx.arc(x, y0, r, 0, THETA, clockwise);
      canvasUtil.ctx.closePath();
      canvasUtil.ctx.fill();
    }
    canvasUtil.clearText();
    canvasUtil.println(`Iteration ${this.iteration}`);
    this.iteration += 1;
  }
}

function refreshData() {
  x0 = WIDTH / 2;
  y0 = HEIGHT / 2;
  r0 = WIDTH / 2;
  circleFractal = new CircleFractal(Color.random());
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  canvasUtil.drawDisk(x0, y0, r0, BLACK.toString()); // black background disk
  circleFractal.iterateAndDraw();
}

function iterate() {
  circleFractal.iterateAndDraw();
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
    refreshData();
  } else {
    alert('You need a better web browser to see this.');
  }
}
