let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let ensemble;
let paused = false;

const OBSTACLE_COLOR = "black";

const SPEED_MIN = 0.01;
const SPEED_MAX = 0.15;
const ACC_MAX = 1;
const BOID_MASS_MAX = 5;

const NUM_BOIDS_MIN = 1;
let NUM_BOIDS = 20;
const NUM_BOIDS_MAX = 500;

const NUM_OBSTACLES_MIN = 0;
let NUM_OBSTACLES = 1;
const NUM_OBSTACLES_MAX = 5;

let TAIL = 5;

let OBSTACLE_MASS_MIN = 10; // 100;
let OBSTACLE_MASS_MOD = 50; // 300;

const G_POW_MIN = 1;
let G_POW = 2;
const G_POW_MAX = 10;

let FLOCK_DIST = 100;

let DIR_ALPHA = 0.25;
let DIR_ALPHA_VAR = 0.1

let SPEED_ALPHA = 0.5;
let SPEED_ALPHA_VAR = 0.3

let WALL_MASS = 15;
let BOID_SIZE = 3
let OBSTACLE_SIZE = 15;


function clamp(x, minVal, maxVal) {
  return Math.max(Math.min(x, maxVal), minVal);
}

const zip = (arr, ...arrs) => {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
}

function pauseDrawing() {
  paused = !paused;
}

function refreshBoids() {
  ensemble.boids = Boid.makeRandom(NUM_BOIDS_MAX);
}

function refreshObstacles() {
  ensemble.obstacles = Obstacle.makeRandom(NUM_OBSTACLES_MAX);
}

class Obstacle { // TODO: rename this to "Obstacle"
  constructor(pos, vel, mass, color) {
    this.pos = pos; // Vec2D
    this.vel = vel; // Vec2D
    this.mass = mass;
    this.color = color;
  }

  toString() {
    return `attractor: pos = ${this.pos.toString()}; mass = ${this.mass.toFixed(3)}`;
  }

  draw() {
    //canvasUtil.drawDisk(this.pos.x, this.pos.y, Math.sqrt(this.mass), this.color);
    canvasUtil.drawDisk(this.pos.x, this.pos.y, OBSTACLE_SIZE, this.color);
  }

  static makeRandom(n) {
    let obstacles = [];
    for (let i=0; i<n; i++) {
      let x = Math.random() * (WIDTH * 0.75) + WIDTH * 0.25;
      let y = Math.random() * (HEIGHT * 0.75) + HEIGHT * 0.25;
      let pos = new Vec2D(x, y);
      let theta = Math.random() * 2 * Math.PI;
      let speed = Math.random() * SPEED_MAX * 10;
      let vel = new Vec2D(speed * Math.cos(theta), speed * Math.sin(theta))
      let mass = Math.random() * (OBSTACLE_MASS_MOD + 1) + OBSTACLE_MASS_MIN;
      obstacles.push(new Obstacle(pos, vel, mass, OBSTACLE_COLOR));
    }
    return obstacles;
  }
}

class Boid { // TODO: rename this to "Boid", don't need tail?
  constructor(pos, vel, acc, mass, color, tail_len) {
    // position is an array holding (at most) the previous TAIL_MAX positions
    // the most recent position is first in the array
    this.ps = new Array(TAIL).fill(pos); // array of Vec2D
    this.vel = vel; // Vec2D
    this.acc = acc; // Vec2D
    this.mass = mass;
    this.color = color;
    this.tail_len = tail_len;
  }

  toString() {
    let p = `pos = ${this.ps[0].toString()}`;
    let v = `vel = ${this.vel.toString()}`;
    let a = `acc = ${this.acc.toString()}`;
    let m = `mass = ${this.mass.toFixed(3)}`;
    return "particle: " + [p, v, a, m].join('; ');
  }

  draw() {
    // to create a tail effect, draw history of positions with older => smaller
    // this doesn't fit too easily into the CanvasUtil framework :/
    canvasUtil.ctx.beginPath();
    canvasUtil.ctx.fillStyle = this.color;
    for (let j=0; j<this.tail_len; j++) {
      let radius = BOID_SIZE * (this.tail_len - j) / this.tail_len;
      canvasUtil.ctx.arc(this.ps[j].x, this.ps[j].y, radius, 0, 2 * Math.PI, true);
    }
    canvasUtil.ctx.closePath();
    canvasUtil.ctx.fill();
  }

  static makeRandom(n) { // TODO: update this to initialize a flock more smartly--might move to the ensemble class
    let boids = [];
    for (let i=0; i<n; i++) {
      let pos = new Vec2D(Math.random() * (WIDTH + 1), Math.random() * (HEIGHT + 1));
      // random velocity vector: random angle and speed
      let theta = Math.random() * 2 * Math.PI;
      let speed = Math.random() * SPEED_MAX / 20;
      let vel = new Vec2D(speed * Math.cos(theta), speed * Math.sin(theta))
      // no initial acceleration
      let acc = new Vec2D(0.0, 0.0);
      // random mass and color
      let mass = 2; //Math.random() * BOID_MASS_MAX + 1;
      let color = Color.colorString(200, 75, 235); // Color.random().toString();
      boids.push(new Boid(pos, vel, acc, mass, color, TAIL));
    }
    return boids;
  }
}


class FlockEnsemble {
  constructor(boids, obstacles) {
    this.boids = boids; // array of Boid objects
    this.obstacles = obstacles; // array of Obstacle objects
  }

  toString(active) {
    let s = `Ensemble has ${this.boids.length} boids and ${this.obstacles.length} obstacles`;
    if (active) {
      s = `Ensemble has ${this.boids.slice(0, NUM_BOIDS).length} boids and ${this.obstacles.slice(0, NUM_OBSTACLES).length} obstacles`;
      for (let i in this.boids.slice(0, NUM_BOIDS)) {
        s += "\n  " + this.boids[i].toString();
      }
      for (let i in this.obstacles.slice(0, NUM_OBSTACLES)) {
        s += "\n  " + this.obstacles[i].toString()
      }
    }
    return s;
  }

  static makeRandom(num_boids, num_obstacles) {
    let boids = Boid.makeRandom(num_boids);
    let obstacles = Obstacle.makeRandom(num_obstacles);
    //canvasUtil.println(`created new ensemble with ${boids.length} boids and ${obstacles.length} obstacles`);
    return new FlockEnsemble(boids, obstacles);
  }

  drawObstacles() {
    this.obstacles.slice(0, NUM_OBSTACLES).forEach(a => a.draw());
  }

  drawBoids() {
    this.boids.slice(0, NUM_BOIDS).forEach(p => p.draw());
  }

  updateState() {
    // update  each obstacle's position
    for (let i=0; i<NUM_OBSTACLES; i++) {
      if (this.obstacles[i].pos.x + this.obstacles[i].vel.x > WIDTH || this.obstacles[i].pos.x + this.obstacles[i].vel.x < 0) {
        this.obstacles[i].vel.x *= -1.0;
      }
      if (this.obstacles[i].pos.y + this.obstacles[i].vel.y > HEIGHT || this.obstacles[i].pos.y + this.obstacles[i].vel.y < 0) {
        this.obstacles[i].vel.y *= -1.0;
      }
      this.obstacles[i].pos = this.obstacles[i].pos.plus(this.obstacles[i].vel)
    }

    // for each boid:
    // - detect flock-mates (nearest neighbors)
    // - compute avg flock-mate direction, compute new direction vector
    // - compute avg flock-mate velocity, compute new velocity vector
    // - check for obstacles and update direction vector
    // apply all speed and direction changes to each boid
    for (let i=0; i<NUM_BOIDS; i++) {
      let G = Math.pow(10, G_POW / 5);
      this.boids[i].acc = new Vec2D(0.0, 0.0);

      // TODO: not sure if we will end up needing acceleration, or if we can use it for something later
      // looks like it can be useful for navigating around obstacles/other boids
      // update acceleration using forces from the obstacles and (optionally) other boids
      for (let j=0; j<NUM_OBSTACLES; j++) {
        let r = this.boids[i].ps[0].minus(this.obstacles[j].pos);
        this.boids[i].acc = r.scale(G * this.obstacles[j].mass / Math.pow(r.normSq(), 1.5)).plus(this.boids[i].acc);
      }

      // boids repel each other slightly
      for (let j=0; j<NUM_BOIDS; j++) {
        if (j != i) {
          let r = this.boids[i].ps[0].minus(this.boids[j].ps[0]);
          this.boids[i].acc = r.scale(G * this.boids[j].mass / Math.pow(r.normSq(), 1.5)).plus(this.boids[i].acc);
        }
      }

      // do the same for the walls -- just take nearest point on each wall
      let wallPoints = [
        new Vec2D(0, this.boids[i].ps[0].y), // Left
        new Vec2D(WIDTH, this.boids[i].ps[0].y), // right
        new Vec2D(this.boids[i].ps[0].x, 0), // top
        new Vec2D(this.boids[i].ps[0].x, HEIGHT) // bottom
      ];
      for (let j=0; j<wallPoints.length; j++) {
        let r = this.boids[i].ps[0].minus(wallPoints[j]);
        this.boids[i].acc = r.scale(G * WALL_MASS / Math.pow(r.normSq(), 1.5)).plus(this.boids[i].acc);
      }

      // bound acceleration
      let accNorm = this.boids[i].acc.norm();
      if (accNorm > ACC_MAX) {
        this.boids[i].acc = this.boids[i].acc.scale(ACC_MAX / accNorm);
      }

      // detect flock-mates (nearest neighbors), this includes itself, otherwise use .filter(pair => 0 < pair[1])
      let flockMateIndices = zip(range(NUM_BOIDS), this.boids)
        .map(pair => [pair[0], this.boids[i].ps[0].distance(pair[1].ps[0])])
        .filter(pair => pair[1] < FLOCK_DIST)
        .map(pair => pair[0]);

      if (flockMateIndices.length > 0) {
        let flockMateVelocities = flockMateIndices.map(k => this.boids[k].vel);
        if (i == 0)  {
          //console.log(this.boids[i].vel.norm()); //map(v => v.toString()).join(', '));
        }
        let avgDir = flockMateVelocities.map(v => v.toUnitVector()).reduce((a, b) => a.plus(b)); //.scale(1 / flockMateIndices.length);
        let avgSpeed = flockMateVelocities.map(v => v.norm()).reduce((a, b) => a + b) / flockMateIndices.length;

        let dirAlpha = clamp(DIR_ALPHA_VAR + Math.random() * (DIR_ALPHA + DIR_ALPHA_VAR), 0, 2 * DIR_ALPHA);
        let speedAlpha = clamp(SPEED_ALPHA_VAR + Math.random() * (SPEED_ALPHA + SPEED_ALPHA_VAR), 0, 2 * SPEED_ALPHA);

        let newDir = this.boids[i].vel.toUnitVector().plus(avgDir.scale(dirAlpha));
        let curSpeed = this.boids[i].vel.norm()
        let newSpeed = clamp(curSpeed + speedAlpha * (avgSpeed - curSpeed), SPEED_MIN, SPEED_MAX);
        this.boids[i].vel = newDir.scale(newSpeed).plus(this.boids[i].acc);
      }

      // keep boid inside the canvas
      if (this.boids[i].ps[0].x + this.boids[i].vel.x > WIDTH || this.boids[i].ps[0].x + this.boids[i].vel.x < 0) {
        this.boids[i].vel.x *= -1.0;
      }
      if (this.boids[i].ps[0].y + this.boids[i].vel.y > HEIGHT || this.boids[i].ps[0].y + this.boids[i].vel.y < 0) {
        this.boids[i].vel.y *= -1.0;
      }

      // get new position, update previous positions
      let pos = this.boids[i].ps[0].plus(this.boids[i].vel)
      this.boids[i].ps = [pos].concat(this.boids[i].ps.slice(0, TAIL - 1));
    }
  }
}

function draw() {
  if (paused) {
    return 0;
  }

  canvasUtil.clearCanvas(Color.colorString(220, 220, 220));
  ensemble.updateState();
  ensemble.drawObstacles();
  ensemble.drawBoids();
}


function init(adjustSize){
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(1.2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    ensemble = FlockEnsemble.makeRandom(NUM_BOIDS_MAX, NUM_OBSTACLES_MAX);
    return setInterval(draw, 5);
  }
  else {
    alert('You need a better web browser to see this.');
  }
}
