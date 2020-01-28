let canvas;
let ctx;
let WIDTH = 1500;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let mouseX = 1;
let mouseY = 1;

let ridges = [];
let numRidges = 7;

const BLACK = new Color(0, 0, 0);
const BLUE = new Color(100, 100, 255);


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
      canvasUtil.drawLine(i, this.heights[i], i, this.maxHeight, this.color, 1);
    }
  }

}


// function draw() {
//
//   // main drawing code
//   canvasUtil.clearCanvas();
//
//   for (r in ridges) {
//     ridges[r].draw();
//   }
// }


function movingAvg(xs, w) {
  let ma = [];
  let padded = range(w-1).map(i => xs[0]).concat(xs);
  for (let k=w; k<xs.length + w; k++) {
    let avg = padded.slice(k-w, k).reduce((a, b) => a + b, 0) / w;
    ma.push(avg);
  }
  return ma;
}

function range(n) {
  return [...Array(n).keys()];
}


function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas(Color.colorString(200, 200, 200));

    for (let i=0; i<numRidges; i++) {
      let t = (i+1)/(numRidges + 1);
      let ridge = new Ridge(t * HEIGHT , Color.interpolate(BLUE, BLACK, t), WIDTH, HEIGHT);
      ridge.fill(h => h + (2 * Math.random() - 1.0) * 15 * t); // random walk, with degree of randomness decreasing with distance
      ridge.heights = movingAvg(ridge.heights, 5 * (numRidges - i) + 5); // smooth out somewhat, with smoothness increasing with distance
      ridges[i] = ridge;
      ridges[i].draw();
    }
  } else {
    alert('You need a better web browser to see this.');
  }
}
