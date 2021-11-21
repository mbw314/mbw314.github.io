let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let grid; // Grid object -- need to rename that class
let count = 0; // used for animation

const COLOR_DEFAULT = "#000000";
const RADIUS_DEFAULT = 4;
const THICKNESS_DEFAULT = 1;

const BG_COLOR = Color.colorString(65, 105, 125);
const DISK_RADIUS = 4;
const INITIAL_RADIUS = 2;
const MIDDLE_RADIUS = 3;
const INITIAL_DISK_COLOR = 'black';
const SEGMENT_WIDTH = 2;
const START_COLOR = 'white'; //Color.colorString(0, 255, 0);
const MIDDLE_COLOR = 'white';
const STOP_COLOR = 'white'; //'red';
const SEGMENT_COLOR = 'white';


class Disk {
  constructor(center, radius, color) {
    this.center = center; // Point
    this.radius = radius;
    this.color = color;
  }
  draw() {
    canvasUtil.drawDisk(this.center.x, this.center.y, this.radius, this.color);
  }
}

class Segment {
  constructor(p0, p1, color, width) {
    this.p0 = p0; // Point
    this.p1 = p1; // Point
    this.color = color;
    this.width = width;
  }
  draw() {
    canvasUtil.drawLine(this.p0.x, this.p0.y, this.p1.x, this.p1.y, this.color, this.width);
  }
}

class Path {
  constructor(vertices) {
    this.vertices = vertices; // array of vertex names
  }

  numVertices() {
    return this.vertices.length;
  }

  numEdges() {
    return Math.max(0, this.vertices.length - 1);
  }

  extend(n) {
    this.vertices.push(n);
  }

  getVertex(i) {
    return this.vertices[i];
  }

  initialVertex() {
    return this.getVertex(0);
  }

  terminalVertex() {
    return this.getVertex(this.vertices.length - 1);
  }

  isLoop() {
    return this.initialVertex() == this.terminalVertex() && this.numVertices >= 3;
  }

  toString() {
    return `${this.vertices.join(" -> ")}`;
  }
}


class Grid {
  constructor(graph) {
    this.graph = graph;
    this.paths = []; // array of Path objects, with edges implied to join consecutive vertices
    this.objs = []; // array of graphical objects (Disk, Segment) to be animated
    this.availableVertices = this.graph.vertexNames();
  }

  numPaths() {
    return this.paths.length;
  }

  printPaths() {
    console.log("path summary:")
    for (let i=0; i<this.numPaths(); i++) {
      console.log(`  path ${i}: ${this.paths[i].toString()}`);
    }
  }

  planAnimation() {
    // convert each path to a list of geometric objects that can be animated
    for (let i=0; i<this.numPaths(); i++) {
      let len = this.paths[i].numVertices();
      if (len >= 1) {
        this.objs.push(new Disk(
          new Point(
            this.graph.vertex(this.paths[i].getVertex(0)).x,
            this.graph.vertex(this.paths[i].getVertex(0)).y
          ),
          DISK_RADIUS,
          START_COLOR)
        );
        for (let j=1; j<len; j++) {
          this.objs.push(new Segment(
            new Point(
              this.graph.vertex(this.paths[i].getVertex(j-1)).x,
              this.graph.vertex(this.paths[i].getVertex(j-1)).y
            ),
            new Point(
              this.graph.vertex(this.paths[i].getVertex(j)).x,
              this.graph.vertex(this.paths[i].getVertex(j)).y
            ),
            MIDDLE_COLOR,
            SEGMENT_WIDTH));
          this.objs.push(new Disk(
            new Point(
              this.graph.vertex(this.paths[i].getVertex(j)).x,
              this.graph.vertex(this.paths[i].getVertex(j)).y
            ),
            MIDDLE_RADIUS,
            MIDDLE_COLOR));
        }
        this.objs.push(new Disk(
          new Point(
            this.graph.vertex(this.paths[i].getVertex(len-1)).x,
            this.graph.vertex(this.paths[i].getVertex(len-1)).y
          ),
          DISK_RADIUS,
          STOP_COLOR));
      }
    }
  }

  randomInitialPoint() {
    // select a random initial point for a path from a list of available points
    if (this.availableVertices.length > 0) {
      let n0 = this.availableVertices[Math.floor(Math.random() * this.availableVertices.length)];
      this.availableVertices = this.availableVertices.filter(n => n != n0);
      return n0;
    }
  }

  createPaths() {
    // populate the array of paths
    while (this.availableVertices.length > 0) {
      let n0 = this.randomInitialPoint();
      this.paths.push(new Path([n0]));
      let canExtendPath = true;
      while (canExtendPath && this.availableVertices.length > 0) {
        canExtendPath = this.extendPath();
      }
    }
    this.consolidatePaths();
  }

  extendPath() {
    let canContinue = true;
    let indexOfLastPath = this.paths.length-1;
    let n0 = this.paths[indexOfLastPath].terminalVertex();
    let availableNeighgbors = this.graph.vertex(n0).neighbors.filter(n => this.availableVertices.includes(n));
    if (availableNeighgbors.length > 0) {
      // look for an entirely new vertex
      let n1 = availableNeighgbors[Math.floor(Math.random() * availableNeighgbors.length)];
      this.availableVertices = this.availableVertices.filter(n => n != n1);
      this.paths[indexOfLastPath].extend(n1);
    } else {
      canContinue = false;
    }
    return canContinue;
  }

  concatenatePaths(i, j) {
    // console.log(`concatenating paths ${i} and ${j}`);
    let p = this.paths[i];
    let q = this.paths[j];
    if (i != j) {
      if (!p.isLoop() && !q.isLoop()) {
        // concat separate paths
        if (this.graph.vertex(p.terminalVertex()).neighbors.includes(q.initialVertex())) {  // 0--p--1 0--q--1 => 0--p--q--1
          this.paths[i] = new Path(p.vertices.concat(q.vertices));
          this.paths.splice(j, 1);
          // console.log(`...done: concatenated paths ${i} and ${j} (case 1)`);
        } else if (this.graph.vertex(p.initialVertex()).neighbors.includes(q.terminalVertex())) {  // 0--q--1 0--p--1 => 0--q--p--1
          this.paths[i] = new Path(q.vertices.concat(p.vertices));
          this.paths.splice(j, 1);
          // console.log(`...done: concatenated paths ${i} and ${j} (case 2)`);
        } else if (this.graph.vertex(p.terminalVertex()).neighbors.includes(q.terminalVertex())) {  // 0--p--1 1--q--0 ==> 0--p--q`--1
          this.paths[i] = new Path(p.vertices.concat(q.vertices.slice().reverse()));
          this.paths.splice(j, 1);
          // console.log(`...done: concatenated paths ${i} and ${j} (case 3)`);
        } else if (this.graph.vertex(p.initialVertex()).neighbors.includes(q.initialVertex())) {  // 1--p--0 0--q--1 => 0--p`--q--1
          this.paths[i] = new Path(p.vertices.slice().reverse().concat(q.vertices));
          this.paths.splice(j, 1);
          // console.log(`...done: concatenated paths ${i} and ${j} (case 4)`);
        }
      }
    } //else {
    //   // create loop from path
    //   if (this.graph.vertex(p.terminalVertex()).neighbors.includes(p.initialVertex()) && p.numVertices() >= 3) {
    //     this.paths[i].extend(this.paths[i].initialVertex());
    //   }
    // }
  }

  canConcatenatePaths(i, j) {
    // determine if two paths can be concatenated, or if a path can be made into a loop
    let p = this.paths[i];
    let q = this.paths[j];
    if (i != j) {
      if (!p.isLoop() && !q.isLoop()) {
        return this.graph.vertex(p.terminalVertex()).neighbors.includes(q.initialVertex())  // 0--p--1 0--q--1
          || this.graph.vertex(p.initialVertex()).neighbors.includes(q.terminalVertex())  // 0--q--1 0--p--1
          || this.graph.vertex(p.terminalVertex()).neighbors.includes(q.terminalVertex())  // 0--p--1 1--q--0
          || this.graph.vertex(p.initialVertex()).neighbors.includes(q.initialVertex())  // 0--q--1 0--p--1
      }
    } //else {
    //   if (p.numVertices() >= 3) {
    //     return this.graph.vertex(p.terminalVertex()).neighbors.includes(p.initialVertex())  // can be made into a loop
    //   }
    // }
  }

  getConsolidationCandidates() {
    // list of all pairs of indices of paths that can be concatenated
    let candidates = [];
    for (let i=0; i<this.numPaths(); i++) {
      for (let j=i; j<this.numPaths(); j++) {
        if (this.canConcatenatePaths(i, j)) {
          candidates.push([i, j]);
        }
      }
    }
    return candidates;
  }

  consolidatePaths() {
    // console.log("consolidating:");
    let candidates = this.getConsolidationCandidates();
    while (candidates.length > 0) {
      let i = Math.floor(Math.random() * candidates.length);
      let pair = candidates[i];
      this.concatenatePaths(pair[0], pair[1]);
      candidates = this.getConsolidationCandidates();
    }
  }
}


function pauseDrawing() {
  paused = !paused;
}

function draw() {
  if (paused) {
    return 0;
  }

  if (count < grid.objs.length) {
    grid.objs[count].draw();
    count++;
  }
}

function updateGraph(type) {
  canvasUtil.clearCanvas(BG_COLOR);
  let graph;
  switch (type) {
    case "grid":
      graph = Graph.gridGraph(parseInt(WIDTH / 25), parseInt(HEIGHT / 25), WIDTH, HEIGHT);
      break;
    case "tri_grid":
      graph = Graph.triangularGridGraph(parseInt(WIDTH / 15), parseInt(HEIGHT / 25), WIDTH, HEIGHT);
      break;
    case "hex_grid":
      graph = Graph.hexagonalGridGraph(parseInt(WIDTH / 8), parseInt(HEIGHT / 15), WIDTH, HEIGHT);
      break;
  }
  grid = new Grid(graph);
  // console.log(grid.graph.toString());
  grid.graph.draw();
  grid.createPaths();
  grid.planAnimation();
  count = 0;
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

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    canvasUtil.clearCanvas(BG_COLOR);
    updateGraph('grid');
    return setInterval(draw, 25);
  } else {
    alert('You need a better web browser to see this.'); }
}
