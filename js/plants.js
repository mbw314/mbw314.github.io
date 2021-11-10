let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let stop = false;

let branches = [];

let splitLimit = 200; // controlled by slider
let dsAvg = 2.5; // controlled by slider
let dsVar = 0.55; // controlled by slider
let angle = Math.PI / 12; // controlled by slider
let splitProb = 0.035; // controlled by slider
let biasProb = 0.05;

let MAX_WIDTH = 75;
let MAX_MASS = 200000;

const BG_COLOR = new Color(225, 225, 250);
const START_COLOR = new Color(50, 35, 25);
const END_COLOR = new Color(100, 235, 150);

const SLIDER_MIN = 0;
const SLIDER_MAX = 50;

const SPLIT_LIMIT_MIN = 1;
const SPLIT_LIMIT_DEFAULT = splitLimit;
const SPLIT_LIMIT_MAX = 400;

const SPLIT_PROB_MIN = 0.01;
const SPLIT_PROB_DEFAULT = splitProb;
const SPLIT_PROB_MAX = 0.05;

const SPEED_MIN = 0.05;
const SPEED_DEFAULT = dsAvg;
const SPEED_MAX = 3.5;

const ANGLE_MIN = Math.PI / 20;
const ANGLE_DEFAULT = angle;
const ANGLE_MAX = Math.PI / 8;


function linesIntersect(a, b, c, d, p, q, r, s) {
  // returns true iff the line segment (a,b)->(c,d) intersects the line segment (p,q)->(r,s)
  let det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  }
  else {
    let lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    let gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
}

class Branch {
  constructor(curPos, lastPos, ds, theta, bias, color, width, curLeftPt, prevLeftPt, curRightPt, prevRightPt) {
    this.curPos = curPos; // Vec2D
    this.lastPos = lastPos; // Vec2D
    this.ds = ds;
    this.theta = theta;
    this.bias = bias;
    this.color = color; // Color object
    this.width = width;
    this.totalMass = 0;
    this.curLeftPt = curLeftPt;
    this.prevLeftPt = prevLeftPt;
    this.curRightPt = curRightPt;
    this.prevRightPt = prevRightPt;
  }

  toString() {
    return `current position = ${this.curPos.toString()}; previous position = ${this.lastPos.toString()}; ds = ${this.ds.toFixed(3)}; theta = ${this.theta.toFixed(3)}; color = ${this.color.toString()}; bias = ${this.bias}; width = ${this.width}`;
  }

  flipBias() {
    this.bias *= -1;
  }

  draw() {
    if (this.width > 15) {
      // fill a polygon
      canvasUtil.ctx.fillStyle = this.color;
      canvasUtil.ctx.beginPath();

      if (this.bias < 0) {
        canvasUtil.ctx.moveTo(this.prevLeftPt.x, this.prevLeftPt.y);
        canvasUtil.ctx.lineTo(this.prevRightPt.x, this.prevRightPt.y);
        canvasUtil.ctx.lineTo(this.curRightPt.x, this.curRightPt.y);

        // if curLeftPt is 'below' prevLeftPt, use prevLeftPt instead
        let intersect = linesIntersect(
          this.curRightPt.x, this.curRightPt.y, this.curLeftPt.x, this.curLeftPt.y,
          this.prevRightPt.x, this.prevRightPt.y, this.prevLeftPt.x, this.prevLeftPt.y);

        if (!intersect) {
          canvasUtil.ctx.lineTo(this.curLeftPt.x, this.curLeftPt.y);
        } else {
          this.curLeftPt = this.prevLeftPt;
        }
      } else {
        canvasUtil.ctx.moveTo(this.prevRightPt.x, this.prevRightPt.y);
        canvasUtil.ctx.lineTo(this.prevLeftPt.x, this.prevLeftPt.y);
        canvasUtil.ctx.lineTo(this.curLeftPt.x, this.curLeftPt.y);

        // if curRightPt is 'below' prevRightPt, use prevRightPt instead
        let intersect = linesIntersect(
          this.curRightPt.x, this.curRightPt.y, this.curLeftPt.x, this.curLeftPt.y,
          this.prevRightPt.x, this.prevRightPt.y, this.prevLeftPt.x, this.prevLeftPt.y);

        if (!intersect) {
          canvasUtil.ctx.lineTo(this.curRightPt.x, this.curRightPt.y);

        } else {
          this.curRightPt = this.prevRightPt;
        }
      }

      canvasUtil.ctx.closePath();
      canvasUtil.ctx.fill();
    } else {
      canvasUtil.drawLine(this.lastPos.x, this.lastPos.y, this.curPos.x, this.curPos.y, this.color.toString(), this.width);
    }
  }

  setTheta() {
    this.theta = this.bias * (Math.random() * angle - angle / 2);
  }

  update() {
    // get direction in which to move
    let dir = this.curPos.minus(this.lastPos).rotate(this.theta).toUnitVector();

    // make sure the new position is inside the canvas
    if (this.curPos.x + this.ds * dir.x > WIDTH || this.curPos.x + this.ds * dir.x < 0) {
      dir.x *= -1;
      this.bias *= -1;
    }
    if (this.curPos.y + this.ds * dir.y > HEIGHT || this.curPos.y + this.ds * dir.y < 0) {
      dir.y *= -1;
      this.bias *= -1;
    }

    // update previous position, set new position p0 <- po + dir * ds
    this.lastPos = this.curPos;
    this.curPos = this.curPos.plus(dir.scale(this.ds));
    this.totalMass += this.width * this.curPos.minus(this.lastPos).norm();

    this.prevLeftPt = this.curLeftPt;
    this.prevRightPt = this.curRightPt;

    this.curLeftPt = this.curPos.plus(dir.scale(this.width / 2).rotate(3 * Math.PI / 2));
    this.curRightPt = this.curPos.plus(dir.scale(this.width / 2).rotate(Math.PI / 2));

  }
}


function stopDrawing() {
  stop = !stop;
}

function draw() {
  let totalMass = branches.map(p => p.totalMass).reduce((a, b) => a + b);
  let N = branches.length;
  let massUsed = totalMass / MAX_MASS;
  let splitsUsed = N / splitLimit;

  if (stop || totalMass > MAX_MASS) {
    return 0;
  }
  //canvasUtil.println(`totalMass = ${totalMass}`);
  let canSplit = false;
  let indexToSplit = 0;
  let newSplitProb = splitProb * (1 - massUsed) + massUsed; // should split more as we approach max mass
  if (Math.random() < newSplitProb && N < splitLimit) {
    canSplit = true;
    indexToSplit = Math.floor(Math.random() * N);
  }

  let tempN = N;
  for (let i=0; i<tempN; i++) {
    if (canSplit == true && i == indexToSplit) {
      N++;
      let newColor = Color.interpolate(branches[i].color, END_COLOR, 0.05);
      let newWidth = Math.max(branches[i].width * 0.85, 1);
      branches[i].width = newWidth;
      branches[i].color = newColor;

      //make a new particle: curPos, lastPos, ds, theta, bias, color, width, curLeftPt, prevLeftPt, curRightPt, prevRightPt
      let newBranch = new Branch(
        new Vec2D(branches[i].curPos.x, branches[i].curPos.y),
        new Vec2D(branches[i].lastPos.x, branches[i].lastPos.y),
        Math.max(Math.random() * dsAvg + dsVar, 1),
        branches[i].theta  + branches[i].bias * Math.PI / 6,
        branches[i].bias * -1,
        newColor,
        newWidth,
        branches[i].curLeftPt,
        branches[i].curLeftPt,
        branches[i].curRightPt,
        branches[i].curRightPt,
      )
      branches.push(newBranch);

      // update the existing and new branch
      branches[i].update();
      branches[N-1].update();
    }
    else {
      // increase angle as we approach maximum mass and/or num splits
      branches[i].theta = branches[i].bias * (Math.random() * angle - angle / 2) * (1 + splitsUsed + massUsed);
      if (Math.random() < biasProb) {
        branches[i].flipBias();
      }
      branches[i].color = Color.interpolate(branches[i].color, END_COLOR, 0.01 * massUsed);
      branches[i].width *= 0.995;
      branches[i].update();
    }
    branches[i].draw();
  }
}

function refreshDrawing() {
  splitProb = 0.035;

  let ds0 = Math.random() * dsAvg + dsVar;
  let theta0 = 3 * Math.PI / 2;
  let p0 = new Vec2D(0.5 * WIDTH , 0.99 * HEIGHT);
  let dir = new Vec2D(Math.cos(theta0), Math.sin(theta0));
  let branch = new Branch(
    p0.plus(dir.scale(ds0)),
    p0,
    ds0,
    theta0,
    1,
    START_COLOR,
    MAX_WIDTH,
    p0.plus(dir.toUnitVector().scale(MAX_WIDTH / 2).rotate(3 * Math.PI / 2)),
    p0.plus(dir.toUnitVector().scale(MAX_WIDTH / 2).rotate(3 * Math.PI / 2)),
    p0.plus(dir.toUnitVector().scale(MAX_WIDTH / 2).rotate(Math.PI / 2)),
    p0.plus(dir.toUnitVector().scale(MAX_WIDTH / 2).rotate(Math.PI / 2))
  )
  branches = [branch];
  canvasUtil.clearCanvas(BG_COLOR.toString());
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    console.log(WIDTH);
    if (WIDTH <= 750) {
      HEIGHT = WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.25 * document.getElementById("controls").clientHeight);
    }
    console.log(HEIGHT);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  MAX_MASS = WIDTH * HEIGHT / 5;
  MAX_WIDTH = WIDTH / 20;

  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    refreshDrawing();
    return setInterval(draw, 5);
  } else {
    alert('You need a better web browser to see this.');
  }
}
