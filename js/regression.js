let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = true;

let M = 200;
const spread = 0.2;
const POINT_COLOR = 'black';
const POINT_RADIUS = 4;
const RESIDUAL_COLOR = 'red';
const RESIDUAL_WIDTH = 1;
const INITIAL_FN = x => 0.5 * x * x * x - 0.2 * x * x - 0.1 * x + 0.65;
let re; // RegressionEnsemble object;


class LearnableFunction { // single variable
  constructor(numParams, evalFn, gradientFns, stringFn) {
    this.params = range(numParams).map(x => Math.random()); // array of parameters to be learned
    this.evalFn = evalFn; // function that takes a variable and the parameters and evaluates the function
    this.gradient = gradientFns; // list of same type as evalFn, representing gradient WRT parameters
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
    //this.centerPoint;
    this.xs = range(WIDTH).map(i => i / WIDTH).map(i => 2 * i - 1); // x values in [-1, 1]
    this.numIterations = 0;
  }

  initPoints(targetFn) {
    // create points near the line y = f(x) (using provided parameters) inside [-1, 1] x R
    let points = [];
    for (let i=0; i<this.numPoints; i++) {
      let newX = 2 * Math.random() - 1;
      let newY = targetFn(newX) + (2 * Math.random() - 1) * spread * Math.random();
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

  mapToCanvas(x, y) {
    // map x-val from [-1, 1] to [0, WIDTH], map y-val from [0, 1] to [0, HEIGHT] ?
    return [0.5 * WIDTH * (x + 1), HEIGHT - y * HEIGHT];
  }

  drawPoints() {
    this.points.forEach(p => {
      let [cx, cy] = this.mapToCanvas(p.x, p.y);
      canvasUtil.drawDisk(cx, cy, POINT_RADIUS, POINT_COLOR)
    });
  }

  drawResiduals() {
    this.points.forEach(p => {
      let [cx0, cy0] = this.mapToCanvas(p.x, p.y);
      let [cx1, cy1] = this.mapToCanvas(p.x, this.f.eval(p.x));
      canvasUtil.drawLine(cx0, cy0, cx1, cy1, RESIDUAL_COLOR, RESIDUAL_WIDTH);
    });
  }

  drawFunctionHistory() {
    let L = this.paramHistory.length;
    // draw all but final line, scaling the color from light to dark
    for (let i=0; i<L; i++) {
      // evenly divide interval [0, 255] and step through backwards
      let c = Math.floor((L-i)*256/L);
      this.xs.map(x => {
        let [cx, cy] = this.mapToCanvas(x, this.f.evalWithParams(x, this.paramHistory[i]));
        canvasUtil.drawRect(cx, cy, 1, 1, Color.colorString(c, c, c));
      });
    }
    // draw the final line in black
    this.xs.map(x => {
      let [cx, cy] = this.mapToCanvas(x, this.f.eval(x));
      canvasUtil.drawRect(cx, cy, 1, 1, 'black');
    });
  }

  gradientDescentStep() {
    let alpha = parseFloat(document.controls.learning_rate.value);
    let cost = 0;
    let costGradients = range(this.numParams).map(i => 0);

    // Cost: J = sum_x (f(x) - y)^2 / 2M
    // Gradient of Cost: \partial J/\partial theta_j = (1/M) sum_x (f(x) - y) * \partial f/\partial \theta_j(x)
    for (let i=0; i<this.numPoints; i++) {
      let residual = this.f.eval(this.points[i].x) - this.points[i].y;
      cost += residual * residual;
      let fGradients = this.f.evalGradient(this.points[i].x);
      for (let j=0; j<this.numParams; j++) {
        costGradients[j] += residual * fGradients[j];
      }
    }
    let newParams = [];
    for (let j=0; j<this.numParams; j++) {
      newParams.push(this.f.params[j] - alpha * costGradients[j] / this.numPoints);
    }
    this.paramHistory.push(this.f.params);
    this.f.params = newParams;
    this.numIterations += 1;
    canvasUtil.clearText();
    canvasUtil.println(`iteration ${this.numIterations}: cost = ${cost.toFixed(5)}`); // technically, 2M * cost
    canvasUtil.println(`y = ${this.f.toString()}`); // technically, 2M * cost
  }
}


function refreshData() {
  canvasUtil.clearCanvas();
  canvasUtil.clearText();
  let regType = document.controls.regtype.value;
  let f = linearFunction;
  if (regType == 'quadratic') {
    f = quadraticFunction;
  } else if (regType == 'cubic') {
    f = cubicFunction;
  }
  f.resetParams();
  re = new RegressionEnsemble(f, M);
  re.initPoints(INITIAL_FN);
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
  ps => `${ps[0].toFixed(5)} + ${ps[1].toFixed(5)} x`
);

const quadraticFunction = new LearnableFunction(
  3,
  (x, ps) => ps[0] + ps[1] * x + ps[2] * x * x,
  [
    (x, ps) => 1,
    (x, ps) => x,
    (x, ps) => x * x
  ],
  ps => `${ps[0].toFixed(5)} + ${ps[1].toFixed(5)} x + ${ps[2].toFixed(5)} x^2`
);

const cubicFunction = new LearnableFunction(
  4,
  (x, ps) => ps[0] + ps[1] * x + ps[2] * x * x + ps[3] * x * x * x,
  [
    (x, ps) => 1,
    (x, ps) => x,
    (x, ps) => x * x,
    (x, ps) => x * x * x
  ],
  ps => `${ps[0].toFixed(5)} + ${ps[1].toFixed(5)} x + ${ps[2].toFixed(5)} x^2 + ${ps[3].toFixed(5)} x^3`
);

function pauseDrawing() {
  paused = !paused;
}


function draw() {
  if (paused) {
    return 0;
  }
  canvasUtil.clearCanvas();
  re.gradientDescentStep();
  re.draw();
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
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    reg_type = document.controls.regtype.value;
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    refreshData();
    return setInterval(draw, 50);
  }
  else alert('You need a better web browser to see this.');
}
