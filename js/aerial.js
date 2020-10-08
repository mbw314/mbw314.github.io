let WIDTH = 1500;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let mouseX = 1;
let mouseY = 1;

const FOREGROUND =  new Color(0, 25, 0); //new Color(200, 135, 0);
const BACKGROUND = new Color(100, 125, 255); //new Color(20, 50, 0);

const HORIZON = Color.colorString(230, 230, 250); //Color.colorString(30, 30, 50);
const SKY = Color.colorString(250, 150, 150); //Color.colorString(50, 50, 255);

const MOON_COLOR = new Color(175, 175, 20);
const MOON_RADIUS = 35;

const POSSIBLE_NUM_RIDGES = [3, 4, 5, 6, 7, 8, 9];

class Ridge {
  constructor(initialHeight, color, width, maxHeight) {
    this.width = width;
    this.color = color;
    this.heights = [initialHeight];
    this.maxHeight = maxHeight;
  }

  fill(f) {
    // f is a function that generates a new height value, using the height value to the left (and possibly other information)
    for (let i=1; i<this.width; i++) {
      this.heights[i] = Math.min(Math.max(0, f(this.heights[i-1])), this.maxHeight);
    }
  }

  draw() {
    for (let i=1; i<this.heights.length; i++) {
      canvasUtil.drawLine(i, this.heights[i], i, this.maxHeight, this.color, 2);
    }
  }
}


function movingAvg(xs, w) {
  let ma = [];
  let padded = range(w-1).map(i => xs[0]).concat(xs);
  for (let k=w; k<xs.length + w; k++) {
    let avg = padded.slice(k-w, k).reduce((a, b) => a + b, 0) / w;
    ma.push(avg);
  }
  return ma;
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight;
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    canvasUtil.clearCanvas(Color.colorString(200, 200, 200));

    ctx.globalAlpha = 1.0;

    let ridges = [];
    let numRidges = POSSIBLE_NUM_RIDGES[Math.floor(Math.random() * POSSIBLE_NUM_RIDGES.length)];

    let grd = ctx.createLinearGradient(0, 0, 0, HEIGHT * (2 / numRidges));
    grd.addColorStop(0, SKY);
    grd.addColorStop(1, HORIZON);

    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WIDTH, HEIGHT * (2 / numRidges));

    // draw the sun/moon?
    let moonX = Math.random() * WIDTH * (5/6) + WIDTH * (1/6);
    let moonY = Math.random() * HEIGHT * (1 / numRidges);
    canvasUtil.drawDisk(moonX, moonY, MOON_RADIUS, MOON_COLOR);

    for (let i=0; i<numRidges; i++) {
      let t = (i+1)/(numRidges + 1);
      let ridge = new Ridge(t * HEIGHT , Color.interpolate(BACKGROUND, FOREGROUND, t), WIDTH, HEIGHT);
      ridge.fill(h => h + (2 * Math.random() - 1.0) * 15 * t); // random walk, with degree of randomness decreasing with distance
      ridge.heights = movingAvg(ridge.heights, 5 * (numRidges - i) + 5); // smooth out somewhat, with smoothness increasing with distance
      ridges[i] = ridge;
      ridges[i].draw();
    }
  } else {
    alert('You need a better web browser to see this.');
  }
}
