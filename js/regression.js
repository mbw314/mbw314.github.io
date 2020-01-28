let canvas;
let ctx;
const WIDTH = 750;
const HEIGHT = 750;
let canvasUtil;

let M = 100;
const spread = 0.25;
const POINT_COLOR = 'black';
const POINT_RADIUS = 4;
const RESIDUAL_COLOR = 'red';
const RESIDUAL_WIDTH = 1;
let re; // RegressionEnsemble object;


class LearnableFunction { // single variable
  constructor(numParams, evalFn, gradientFns, stringFn) {
    this.params = range(numParams).map(x => Math.random()); // array of parameters to be learned
    this.evalFn = evalFn; // function that takes a variable and the parameters and evaluates the function
    this.gradient = gradientFns; // list of same type as evalFn
    this.stringFn = stringFn; // function to convert params into string representation of function
  }

  eval(x) {
    return this.evalFn(x, this.params);
  }

  evalWithParams(x, params) {
    return this.evalFn(x, params);
  }

  evalGradient(x) {
    return this.gradient.map(g => g(x, this.params));
  }

  resetParams() {
    this.params = this.params.map(x => Math.random());
  }

  toString() {
    return this.stringFn(this.params);
  }
}


class RegressionEnsemble {
  constructor(f, numPoints) {
    this.f = f; // LearnableFunction object
    this.numParams = f.params.length;
    this.numPoints = numPoints;
    this.points; // array of Point objects
    this.paramHistory = [this.f.params]; // array of learned parameter arays
  }

  initPoints(params) {
    // create points near the line y = f(x) inside [0, 1] x [0, 1]
    let points = [];
    for (let i=0; i<this.numPoints; i++) {
      let newX = Math.random();
      let newY = this.f.evalWithParams(newX, params) + (2 * Math.random() - 1) * spread * Math.random();
      points.push(new Point(newX, newY));
    }
    this.points = points;
    // reinitialize f to the mean of the y-values
    let yMean = this.points.map(p => p.y).reduce((a, b) => a + b, 0) / this.numPoints;
    this.f.params = range(this.numParams).map(x => 0);
    this.f.params[0] = yMean;
  }

  draw() {
    this.drawPoints();
    this.drawFunctionHistory();
    this.drawResiduals();
  }

  drawPoints() {
    this.points.forEach(p =>
      canvasUtil.drawDisk(p.x * WIDTH, p.y * HEIGHT, POINT_RADIUS, POINT_COLOR));
  }

  drawResiduals() {
    this.points.forEach(p =>
      canvasUtil.drawLine(p.x * WIDTH, p.y * HEIGHT, p.x * WIDTH, this.f.eval(p.x) * HEIGHT, RESIDUAL_COLOR, RESIDUAL_WIDTH));
  }

  drawFunctionHistory() {
    let L = this.paramHistory.length;
    // draw all but final line, scaling the color from light to dark
    for (let i=0; i<L; i++) {
      // evenly divide interval [0,255] and step through backwards
      let c = Math.floor((L-i)*256/L);
      for (let x=0; x<WIDTH; x++) {
        canvasUtil.drawRect(
          x, this.f.evalWithParams(x / WIDTH, this.paramHistory[i]) * HEIGHT, 1, 1, Color.colorString(c, c, c));
      }
    }
    // draw the final line in black
    for (let x=0; x<WIDTH; x++) {
      canvasUtil.drawRect(
        x,  this.f.eval(x / WIDTH) * HEIGHT, 1, 1, 'black');
    }
  }

  gradientDescentStep() {
    let alpha = parseFloat(document.controls.learning_rate.value);
    let loss = 0;
    let lossGradients = this.f.params.map(i => 0);

    // Loss: L = sum_x (f(x) - y)^2 / 2M
    // Gradient of Loss: \partial L/\partial theta_j = (1/M) sum_x (f(x) - y) * \partial f/\partial \theta_j(x)
    for (let i=0; i<this.numPoints; i++) {
      let residual = this.f.eval(this.points[i].x) - this.points[i].y;
      loss += residual * residual;
      let fGradients = this.f.evalGradient(this.points[i].x);
      for (let j=0; j<this.numParams; j++) {
        lossGradients[j] += residual * fGradients[j];
      }
    }
    let newParams = [];
    for (let j=0; j<this.numParams; j++) {
      newParams.push(this.f.params[j] - alpha * lossGradients[j] / this.points.length);
    }
    this.paramHistory.push(this.f.params);
    this.f.params = newParams;
    canvasUtil.println(`loss: ${loss.toFixed(5)}; new function: ${this.f.toString()}`);
  }
}


function refreshData() {
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  let f = (document.controls.regtype.value == 'linear') ? linearFunction : quadraticFunction;
  f.resetParams();
  let initialParams = (document.controls.regtype.value == 'linear') ? [0.35, 0.3] : [0.35, 0.25, 0.1];
  re = new RegressionEnsemble(f, M);
  re.initPoints(initialParams);
  re.draw();
}

function iterate() {
  canvasUtil.clearCanvas();
  re.gradientDescentStep();
  re.draw();
}

const linearFunction = new LearnableFunction(
  2,
  (x, ps) => ps[0] + ps[1] * x,
  [
    (x, ps) => 1,
    (x, ps) => x
  ],
  ps => `${ps[0].toFixed(5)} + ${ps[1].toFixed(5)} * x`
);

const quadraticFunction = new LearnableFunction(
  3,
  (x, ps) => ps[0] + ps[1] * x + ps[2] * x * x,
  [
    (x, ps) => 1,
    (x, ps) => x,
    (x, ps) => x * x
  ],
  ps => `${ps[0].toFixed(5)} + ${ps[1].toFixed(5)} * x + ${ps[2].toFixed(5)} * x^2`
);

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
    reg_type = document.controls.regtype.value;
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    refreshData();
  }
  else alert('You need a better web browser to see this.');
}
