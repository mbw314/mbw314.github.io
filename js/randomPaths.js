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
const START_COLOR = Color.colorString(0, 255, 0);
const MIDDLE_COLOR = 'white';
const STOP_COLOR = 'red';
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

class Grid {
  constructor(graph) {
    this.graph = graph;
    this.paths = [[]]; // array of array of vertices, with edges implied to join consecutive elements
    this.objs = [] // array of graphical objects (Disk, Segment) to be animated
  }

  planAnimation() {
    // convert all paths to list of geometric objects that can be animated
    for (let i=0; i<this.paths.length; i++) {
      let len = this.paths[i].length;
      if (len >= 1) {
        this.objs.push(new Disk(
            new Point(this.paths[i][0].x, this.paths[i][0].y),
            DISK_RADIUS,
            START_COLOR));
        for (let j=1; j<len; j++) {
          this.objs.push(new Segment(
            new Point(this.paths[i][j-1].x, this.paths[i][j-1].y),
            new Point(this.paths[i][j].x, this.paths[i][j].y),
            MIDDLE_COLOR,
            SEGMENT_WIDTH));
          this.objs.push(new Disk(
            new Point(this.paths[i][j].x, this.paths[i][j].y),
            MIDDLE_RADIUS,
            MIDDLE_COLOR));
        }
        this.objs.push(new Disk(
          new Point(this.paths[i][len-1].x, this.paths[i][len-1].y),
          DISK_RADIUS,
          STOP_COLOR));
      }
    }
  }

  numAvailablePositions() {
    return this.graph.vertices.length;
  }

  getAvailablePositions() {
    return this.graph.vertices;
  }

  randomInitialPoint() {
    // select a random initial point for a path from a list of available points
    let avails = this.getAvailablePositions();
    if (avails.length > 0) {
      let v = avails[Math.floor(Math.random() * avails.length)];
      this.graph.deleteVertex(v);
      return v;
    }
  }

  createPaths() {
    // populate the array of paths
    let numAvails = this.numAvailablePositions();
    while (numAvails > 0) {
      let v = this.randomInitialPoint();
      this.paths.push([v]);
      let canExtendPath = true;
      numAvails = this.numAvailablePositions();
      while (canExtendPath && numAvails > 0) {
        canExtendPath = this.extendPath();
      }
      numAvails = this.numAvailablePositions();
    }
  }

  extendPath() {
    let canContinue = true;
    let lastPathLength = this.paths[this.paths.length-1].length;
    let v0 = this.paths[this.paths.length-1][lastPathLength-1];
    if (v0.degree() > 0) {
      let v1 = this.graph.getVertexByName(v0.neighbors[Math.floor(Math.random() * v0.degree())]);
      this.graph.deleteVertex(v1); // make it unavailable
      this.paths[this.paths.length-1].push(v1);
    } else {
      canContinue = false;
    }
    return canContinue;
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
  graph.draw();
  grid = new Grid(graph);
  grid.createPaths();
  grid.planAnimation();
  count = 0;
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  console.log(`${WIDTH} ${HEIGHT}`);
  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    canvasUtil.clearCanvas(BG_COLOR);
    updateGraph('grid');
    return setInterval(draw, 15);
  } else {
    alert('You need a better web browser to see this.'); }
}
