let canvas;
let ctx;
let canvasUtil;
let WIDTH = 750;
let HEIGHT = 750;
let ms;

let X_MIN = -1.75;
let X_MAX = 0.75;
let Y_MIN = -1.25
let Y_MAX = 1.25;
const RADIUS = 2.0;
const MAX_ITERATIONS = 175;
const SCALE_FACTOR = 2.5;
const COLOR0 = new Color(0, 0, 255);
const COLOR1 = new Color(0, 255, 0);
let zoomExp = -1; // -1 for zoom in, +1 for zoom out


class MandelbrotSet {
  constructor({
      xMin = X_MIN,
      xMax = X_MAX,
      yMin = Y_MIN,
      yMax = Y_MAX,
      canvasWidth = WIDTH,
      canvasHeight = HEIGHT,
      radius = RADIUS,
      maxIterations = MAX_ITERATIONS,
      scaleFactor = SCALE_FACTOR,
      color0 = COLOR0,
      color1 = COLOR1
    }) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.radius = radius;
    this.maxIterations = maxIterations;
    this.scaleFactor = scaleFactor;
    this.color0 = color0;
    this.color1 = color1;
    this.colorLookup = this.getColorLookup(color0, color1, maxIterations);
  }

  toString() {
    return `[${this.xMin.toFixed(5)}, ${this.xMax.toFixed(5)}] x [${this.yMin.toFixed(5)}, ${this.yMax.toFixed(5)}]`
  }

  getColorLookup(c0, c1, n) {
    let lookup = [];
    for (let i = 0; i < n; i++) {
      let c = Color.interpolate(c0, c1, Math.sqrt(i / (n - 1)));
      lookup.push(c);
    }
    lookup.push(new Color(0, 0, 0));
    return lookup;
  }

  draw(ctx) {
    let imageData = ctx.createImageData(this.canvasWidth, this.canvasHeight);
    canvasUtil.println(this.toString());
    let time0 = (new Date()).getTime();
    let radius_sq = this.radius * this.radius;
    let xScale = (this.xMax - this.xMin) / this.canvasWidth;
    let yScale = (this.yMax - this.yMin) / this.canvasHeight;
    for (let x = 0; x < this.canvasWidth; x++) {
      for (let y = 0; y < this.canvasHeight; y++) {
        let c_x = this.xMin + x * xScale;
        let c_y = this.yMin + y * yScale;
        let z_x = 0.0;
        let z_y = 0.0;
        let iteration = 0;

        // wikipedia optimzation
        let re_sq = 0;
        let im_sq = 0;
        let z_sq = 0;
        while (iteration < this.maxIterations && re_sq + im_sq < radius_sq) {
          z_x = re_sq - im_sq + c_x
          z_y = z_sq - re_sq - im_sq + c_y
          re_sq = z_x * z_x
          im_sq = z_y * z_y
          z_sq = (z_x + z_y) * (z_x + z_y)
          iteration += 1;
        }

        let pixelIndex = (y * this.canvasWidth + x) * 4;
        let color = this.colorLookup[iteration];
        imageData.data[pixelIndex] = color.r;
        imageData.data[pixelIndex+1] = color.g;
        imageData.data[pixelIndex+2] = color.b;
        imageData.data[pixelIndex+3] = 255;   // Alpha
      }
    }
    ctx.putImageData(imageData, 0, 0);
    let time1 = (new Date()).getTime();
    let delta_t = time1 - time0;
    canvasUtil.println("Drawing completed in " + delta_t + " milliseconds.");
  }
}


function fillPixel(x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function zoom(x0, y0) {
  let inOrOut = (zoomExp == -1) ? 'in' : 'out';
  canvasUtil.println(`zooming ${inOrOut} around pixel (${x0}, ${y0})`);

  let xScale = (ms.xMax - ms.xMin) / ms.canvasWidth;
  let yScale = (ms.yMax - ms.yMin) / ms.canvasHeight;

  let x = ms.xMin + x0 * xScale;
  let y = ms.yMin + y0 * yScale;

  let new_half_width = 0.5 * (ms.xMax - ms.xMin) * Math.pow(ms.scaleFactor, zoomExp);
  let new_half_height = 0.5 * (ms.yMax - ms.yMin) * Math.pow(ms.scaleFactor, zoomExp);

  ms.xMin = x - new_half_width;
  ms.xMax = x + new_half_width;
  ms.yMin = y - new_half_height;
  ms.yMax = y + new_half_height;

  ms.draw(ctx);
  zoomExp = -1;
}

function resetState() {
  canvasUtil.clearCanvas('black');
  ms = new MandelbrotSet({});
  ms.draw(ctx);
}

function init(adjustSize) {
  canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas('black');

    if (HEIGHT < WIDTH) {
      let xSpan = (Y_MAX - Y_MIN) * WIDTH / HEIGHT;
      X_MIN = -2 * xSpan / 3;
      X_MAX = xSpan / 3;
    } else if (WIDTH < HEIGHT) {
      let ySpan = (X_MAX - X_MIN) * HEIGHT / WIDTH;
      Y_MIN = -1 * ySpan / 2;
      Y_MAX = ySpan / 2;
    }

    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect()
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        zoom(x, y);
      }
    );

    document.addEventListener('keydown', function(e) {
        if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
          zoomExp = 1;
        }
      }
    );

    resetState();
  }
  else { alert('You need a better web browser to see this.'); }
}
