let canvas;
let ctx;
let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let stop = false;

let particles = [];

let splitLimit = 200;
let dsAvg = 0.75;
let dsVar = 0.35;
let biasProb = 0.05;
let angle = Math.PI / 4;
let splitProb = 0.035;

const MAX_WIDTH = 1;

const BG_COLOR = new Color(105, 105, 0);
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(255, 255, 255);

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
const SPEED_MAX = 2.5;

const ANGLE_MIN = Math.PI / 12;
const ANGLE_DEFAULT = angle;
const ANGLE_MAX = 2 * Math.PI / 3;

function stopDrawing() {
  stop = !stop;
}

function draw() {
  let N = particles.length;

  if (stop) {
    return 0;
  }

  let canSplit = false;
  let indexToSplit = 0;
  if (Math.random() < splitProb && N < splitLimit) {
    canSplit = true;
    indexToSplit = Math.floor(Math.random() * N);
  }

  let tempN = N;
  for (let i=0; i<tempN; i++) {
    if (canSplit == true && i == indexToSplit) {
      N++;
      let t = N / splitLimit;
      let newColor = Color.interpolate(BLACK, WHITE, t).toString();
      let newWidth = Math.max(particles[i].width - 1, 1);
      particles[i].width = newWidth;

      //make a new particle: curPos, lastPos, ds, theta, bias, color
      let newParticle = new Particle(
        new Vec2D(particles[i].curPos.x, particles[i].curPos.y),
        new Vec2D(particles[i].lastPos.x, particles[i].lastPos.y),
        Math.random() * dsAvg + dsVar,
        particles[i].theta * -1,
        particles[i].bias * -1,
        newColor,
        newWidth
      )
      particles.push(newParticle);

      // update the existing and new particle
      particles[i].update();
      particles[N-1].update();
    }
    else {
      particles[i].setTheta();
      if (Math.random() < biasProb) {
        particles[i].flipBias();
      }
      particles[i].update();
    }
    particles[i].draw();
  }
}

class Particle {
  constructor(curPos, lastPos, ds, theta, bias, color, width) {
    this.curPos = curPos; // Vec2D
    this.lastPos = lastPos; // Vec2D
    this.ds = ds;
    this.theta = theta;
    this.bias = bias;
    this.color = color;
    this.width = width;
  }

  toString() {
    return `current position = ${this.curPos.toString()}; previous position = ${this.lastPos.toString()}; ds = ${this.ds.toFixed(3)}; theta = ${this.theta.toFixed(3)}; color = ${this.color}; bias = ${this.bias}; width = ${this.width}`;
  }


  flipBias() {
    this.bias *= -1;
  }

  draw() {
    canvasUtil.drawLine(this.lastPos.x, this.lastPos.y, this.curPos.x, this.curPos.y, this.color, this.width);
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
  }
}

function refreshDrawing() {
  splitProb = 0.035;

  //make a new particle: curPos, lastPos, ds, theta, bias, color
  let ds0 = Math.random() * dsAvg + dsVar;
  let theta0 = Math.random() * Math.PI * 2
  let p0 = new Vec2D(WIDTH / 2, HEIGHT / 2);
  let dir = new Vec2D(Math.cos(theta0), Math.sin(theta0));
  let particle = new Particle(
    p0.plus(dir.scale(ds0)),
    p0,
    ds0,
    theta0,
    1,
    BLACK,
    MAX_WIDTH
  )
  particles = [particle];
  canvasUtil.clearCanvas(BG_COLOR.toString());
}


function init(adjustSize) {
  canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(1.2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT); //, document.outform.output);
    refreshDrawing();
    return setInterval(draw, 10);
  }
  else {
    alert('You need a better web browser to see this.');
  }
}
