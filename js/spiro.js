let WIDTH = 750;
let HEIGHT = 750;
let canvas;
let ctx;
let canvasUtil;

let X_MIN = -1;
let X_MAX = 1;
let Y_MIN = -1
let Y_MAX = 1;

const T = 0.1;
const OUTER_RADIUS = 1;

const SLIDER_MIN = 1;
const SLIDER_MAX = 150;
const K_MIN = -1.0;
const K_DEFAULT = 0.77;
const K_MAX = 2.0;
const L_MIN = -1.0;
const L_DEFAULT = 0.67;
const L_MAX = 2.0;

class ParametrizedCurve {
  constructor(param, t0, t1, numDivisions, projectionFn, colorFn) {
    this.param = param; // function t -> Point3D -- parametrization of the curve, with t in [t0, t1]
    this.t0 = t0; // start time
    this.t1 = t1; // end time
    this.numDivisions = numDivisions; // number of time subdivision
    this.projectionFn = projectionFn; // function R^n -> R^2 mapping space to canvas
    this.colorFn = colorFn; // function t -> Color
  }

  toString() {
    return `param=${this.param}; t0=${0.5*this.t1/Math.PI} * 2pi`;
  }

  getT(i) {
    return this.t0 + i * (this.t1 - this.t0) / this.numDivisions;
  }

  draw() {
    let prevScreenPt = this.projectionFn(this.param(this.getT(0)));
    for (let i=1; i <= this.numDivisions; i++) {
      let t = this.getT(i);
      let newScreenPt = this.projectionFn(this.param(t));
      let c = this.colorFn(t);
      canvasUtil.drawLine(prevScreenPt.x, prevScreenPt.y, newScreenPt.x, newScreenPt.y, c, 1);
      prevScreenPt = newScreenPt;
    }
  }
}

function resetDrawing() {
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  draw(K_DEFAULT, L_DEFAULT);
}

function spaceToScreenXY(p) {
  let x = WIDTH * (p.x - X_MIN) / (X_MAX - X_MIN);
  let y = HEIGHT * (Y_MAX - p.y) / (Y_MAX - Y_MIN);
  return new Point(x, y);
}

function _lcm(x, y) {
   if ((typeof x !== 'number') || (typeof y !== 'number'))
    return false;
  return (!x || !y) ? 0 : Math.abs((x * y) / _gcd(x, y));
}

function _gcd(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  while (y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function getPolarCurve(k, l) {
  let N = SLIDER_MAX - SLIDER_MIN + 1; // number of buckets for r0
  let r0 = Math.round(k * OUTER_RADIUS * N); // r = r0 / N
  // period of second trig fns is k / (1 - k) = r0 / (N - r0)
  let lcm = _lcm(r0, 2) / _gcd(N - r0, 1);
  let g = 255 * (k - K_MIN) / (K_MAX - K_MIN);
  let b = 255 * (l - L_MIN) / (L_MAX - L_MIN);
  //canvasUtil.println(`k=${k.toFixed(5)}; l=${l.toFixed(5)}; r0=${r0}; lcm=${lcm}; g=${g}; b=${b}`);

  return new ParametrizedCurve(
    t => new Point(
      OUTER_RADIUS * ((1 - k) * Math.cos(2 * Math.PI * t) + l * k * Math.cos(2 * Math.PI * (1 - k) * t / k)),
      OUTER_RADIUS * ((1 - k) * Math.sin(2 * Math.PI * t) + l * k * Math.sin(2 * Math.PI * (1 - k) * t / k))),
    0,
    lcm,
    250 * lcm,
    spaceToScreenXY,
    t => Color.colorString(100, g, b)
  );
}

function draw(k, l) {
  canvasUtil.clearCanvas();
  let curve = getPolarCurve(k, l);
  curve.draw()
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
    ctx.imageSmoothingQuality = "high";
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);

    if (HEIGHT < WIDTH) {
      let xSpan = (Y_MAX - Y_MIN) * WIDTH / HEIGHT;
      X_MIN = -1 * xSpan / 2;
      X_MAX = xSpan / 2;
    } else if (WIDTH < HEIGHT) {
      let ySpan = (X_MAX - X_MIN) * HEIGHT / WIDTH;
      Y_MIN = -1 * ySpan / 2;
      Y_MAX = ySpan / 2;
    }

    resetDrawing();
  } else {
    alert('You need a better web browser to see this.');
  }
}
