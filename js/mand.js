// TODO:
// investigate drawing pixels: let imagedata = context.createImageData(width, height);

let canvas;
let ctx;
let canvasUtil;
const WIDTH = 750;
const HEIGHT = 750;
let ms;

const X_MIN = -2.0;
const X_MAX = 1.0;
const Y_MIN = -1.5
const Y_MAX = 1.5;
const RADIUS = 2.0;
const MAX_ITERATIONS = 105;
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
    //this.colorLookup.forEach(c => canvasUtil.println(c.toString()));
  }

  toString() {
    return `[${this.xMin.toFixed(5)}, ${this.xMax.toFixed(5)}] x [${this.yMin.toFixed(5)}, ${this.yMax.toFixed(5)}]`
  }

  f(x, y, c_x, c_y) {
    // the update function
    return [x * x - y * y + c_x, 2 * x * y + c_y];
  }

  getColorLookup(c0, c1, n) {
    let lookup = [];
    for (let i = 0; i < n; i++) {
      let c = Color.interpolate(c0, c1, Math.sqrt(i / (n - 1)));
      lookup.push(c.toString());
    }
    lookup.push('rgb(0, 0, 0)');
    return lookup;
  }

  draw(ctx) {
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

        // this wikipedia optimzation is slower in chrome, faster in firefox
        // let rsquare = 0;
        // let isquare = 0;
        // let zsquare = 0;
        // while (iteration < this.maxIterations && rsquare + isquare < radius_sq) {
        //   z_x = rsquare - isquare + c_x
        //   z_y = zsquare - rsquare - isquare + c_y
        //   rsquare = z_x * z_x
        //   isquare = z_y * z_y
        //   zsquare = (z_x + z_y) * (z_x + z_y)
        //   iteration += 1;
        // }

        while (iteration < this.maxIterations && z_x * z_x + z_y * z_y < radius_sq) {
          [z_x, z_y] = this.f(z_x, z_y, c_x, c_y);
          iteration += 1;
        }

        fillPixel(x, y, this.colorLookup[iteration]);
      }
    }
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

  //canvasUtil.println(` this corresponds to plane point (${x.toFixed(5)}, ${y})`)

  let new_half_width = 0.5 * (ms.xMax - ms.xMin) * Math.pow(ms.scaleFactor, zoomExp);
  let new_half_height = 0.5 * (ms.yMax - ms.yMin) * Math.pow(ms.scaleFactor, zoomExp);

  ms.xMin = x - new_half_width;
  ms.xMax = x + new_half_width;
  ms.yMin = y - new_half_height;
  ms.yMax = y + new_half_height;
  //canvasUtil.println(ms.toString());
  ms.draw(ctx);
  zoomExp = -1;
}

function resetState() {
  canvasUtil.clearCanvas('black');
  ms = new MandelbrotSet({});
  ms.draw(ctx);
}

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = WIDTH;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);

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
