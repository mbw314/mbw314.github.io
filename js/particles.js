var canvas;
var ctx;
var WIDTH = 750;
var HEIGHT = 750;
var canvasUtil;
var ensemble;
var paused = false;

const ATTRACTOR_COLOR = "black";

var SPEED_MAX = 20;
var ACC_MAX = 1;
var PARTICLE_MASS_MAX = 5;

var NUM_PARTICLES_MIN = 1;
var NUM_PARTICLES = 2;
var NUM_PARTICLES_MAX = 10;

var NUM_ATTRACTORS_MIN = 1;
var NUM_ATTRACTORS = 2;
var NUM_ATTRACTORS_MAX = 5;

var TAIL = 10;

var ATT_MASS_MIN = 100;
var ATT_MASS_MOD = 300;

var G_POW_MIN = 1;
var G_POW = 5;
var G_POW_MAX = 10;


function pauseDrawing() {
  paused = !paused;
}

function refreshParticles() {
  ensemble.particles = Particle.makeRandom(NUM_PARTICLES_MAX);
}

function refreshAttractors() {
  ensemble.attractors = Attractor.makeRandom(NUM_ATTRACTORS_MAX);
}

class Attractor {
  constructor(pos, mass, color) {
    this.pos = pos; // Vec2D
    this.mass = mass;
    this.color = color;
  }

  toString() {
    return `attractor: pos = ${this.pos.toString()}; mass = ${this.mass.toFixed(3)}`;
  }

  draw() {
    canvasUtil.drawDisk(this.pos.x, this.pos.y, Math.sqrt(this.mass), this.color);
  }

  static makeRandom(n) {
    let attractors = [];
    for (let i=0; i<n; i++) {
      let x = Math.random() * (WIDTH * 0.5) + WIDTH * 0.25;
      let y = Math.random() * (HEIGHT * 0.5) + HEIGHT * 0.25;
      let pos = new Vec2D(x, y);
      let mass = Math.random() * (ATT_MASS_MOD + 1) + ATT_MASS_MIN;
      attractors.push(new Attractor(pos, mass, ATTRACTOR_COLOR));
    }
    return attractors;
  }
}

class Particle {
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
    ctx.beginPath();
    ctx.fillStyle = this.color;
    for (let j=0; j<this.tail_len; j++) {
      let radius = 2 * this.mass * (this.tail_len - j) / this.tail_len;
      ctx.arc(this.ps[j].x, this.ps[j].y, radius, 0, 2 * Math.PI, true);
    }
    ctx.closePath();
    ctx.fill();
  }

  static makeRandom(n) {
    let particles = [];
    for (let i=0; i<n; i++) {
      let pos = new Vec2D(Math.random() * (WIDTH + 1), Math.random() * (HEIGHT + 1));
      // random velocity vector: random angle and speed
      let theta = Math.random() * 2 * Math.PI;
      let speed = Math.random() * SPEED_MAX / 10;
      let vel = new Vec2D(speed * Math.cos(theta), speed * Math.sin(theta))
      // no initial acceleration
      let acc = new Vec2D(0.0, 0.0);
      // random mass and color
      let mass = Math.random() * PARTICLE_MASS_MAX + 1;
      let color = Color.random().toString();
      particles.push(new Particle(pos, vel, acc, mass, color, TAIL));
    }
    return particles;
  }
}


class Ensemble {
  constructor(particles, attractors) {
    this.particles = particles; // array of Particle objects
    this.attractors = attractors; // array of Attractor objects
  }

  toString(active) {
    let s = `Ensemble has ${this.particles.length} particles and ${this.attractors.length} attractors`;
    if (active) {
      s = `Ensemble has ${this.particles.slice(0, NUM_PARTICLES).length} particles and ${this.attractors.slice(0, NUM_ATTRACTORS).length} attractors`;
      for (let i in this.particles.slice(0, NUM_PARTICLES)) {
        s += "\n  " + this.particles[i].toString();
      }
      for (let i in this.Attractor.slice(0, NUM_ATTRACTORS)) {
        s += "\n  " + this.attractors[i].toString()
      }
    }
    return s;
  }

  static makeRandom(num_particles, num_attractors) {
    let particles = Particle.makeRandom(num_particles);
    let attractors = Attractor.makeRandom(num_attractors);
    //canvasUtil.println(`created new ensemble with ${particles.length} particles and ${attractors.length} attractors`);
    return new Ensemble(particles, attractors);
  }

  drawAttractors() {
    this.attractors.slice(0, NUM_ATTRACTORS).forEach(a => a.draw());
  }

  drawParticles() {
    this.particles.slice(0, NUM_PARTICLES).forEach(p => p.draw());
  }

  updateState() {
    // update each position, velocity, acceleration
    for (let i=0; i<NUM_PARTICLES; i++) {
      let G = Math.pow(10, G_POW / 5);
      this.particles[i].acc = new Vec2D(0.0, 0.0);

      // update acceleration using forces from the attractors and (optionally) other particles
      for (let j=0; j<NUM_ATTRACTORS; j++) {
        let r = this.particles[i].ps[0].minus(this.attractors[j].pos);
        this.particles[i].acc = r.scale(-1.0 * G * this.attractors[j].mass / Math.pow(r.normSq(), 1.5)).plus(this.particles[i].acc);
      }

      if (document.getElementById("massive").value == 0) {
        for (var j=0; j<NUM_PARTICLES; j++) {
          if (j != i) {
            let r = this.particles[i].ps[0].minus(this.particles[j].ps[0]);
            this.particles[i].acc = r.scale(-1.0 * G * this.particles[j].mass / Math.pow(r.normSq(), 1.5)).plus(this.particles[i].acc);
          }
        }
      }

      // bound acceleration
      let accNorm = this.particles[i].acc.norm();
      if (accNorm > ACC_MAX) {
        this.particles[i].acc = this.particles[i].acc.scale(ACC_MAX / accNorm);
      }

      // update and bound velocity
      this.particles[i].vel = this.particles[i].vel.plus(this.particles[i].acc);
      let speed = this.particles[i].vel.norm();
      if (speed > SPEED_MAX) {
        this.particles[i].vel = this.particles[i].vel.scale(SPEED_MAX / speed);
      }

      // if keeping the particles inside the canvas...
      if (document.getElementById("confine").value == 0) {
        if (this.particles[i].ps[0].x + this.particles[i].vel.x > WIDTH || this.particles[i].ps[0].x + this.particles[i].vel.x < 0) {
          this.particles[i].vel.x *= -1.0;
        }
        if (this.particles[i].ps[0].y + this.particles[i].vel.y > HEIGHT || this.particles[i].ps[0].y + this.particles[i].vel.y < 0) {
          this.particles[i].vel.y *= -1.0;;
        }
      }

      // get new position, update previous positions
      let pos = this.particles[i].ps[0].plus(this.particles[i].vel)
      // TODO: make this more efficient
      this.particles[i].ps = [pos].concat(this.particles[i].ps.slice(0, TAIL - 1));
    }
  }
}

function draw() {
  if (paused) {
    return 0;
  }

  canvasUtil.clearCanvas(Color.colorString(200, 200, 200));
  ensemble.updateState();
  ensemble.drawAttractors();
  ensemble.drawParticles();
}


function init(adjustSize){
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
    ensemble = Ensemble.makeRandom(NUM_PARTICLES_MAX, NUM_ATTRACTORS_MAX);
    return setInterval(draw, 5);
  }
  else {
    alert('You need a better web browser to see this.');
  }
}
