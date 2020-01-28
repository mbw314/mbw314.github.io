let canvas;
let ctx;
const WIDTH = 750;
const HEIGHT = 750;
let canvasUtil;
let paused = false;
let grid; // Grid object
let count = 0; // used for animation

const BG_COLOR = Color.colorString(65, 105, 125);
const DISK_RADIUS = 4;
const INITIAL_RADIUS = 2;
const MIDDLE_RADIUS = 3;
const INITIAL_DISK_COLOR = 'black';
const SEGMENT_WIDTH = 1;
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
  constructor(numRows, numCols, sepX, sepY) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.sepX = sepX;
    this.sepY = sepY;
    this.paths = [[]]; // array of array of Point objects
    this.objs = [] // array of graphical objects (Disk, Segment) to be animated
    // availablePositions is a double array of objects {'coords': [i, j, 'avail': 1 or 0}
    // need to be able do these easily: tell how many are available,
    // check the status of one, randomly select an open one, and change the status of one
    this.availablePositions = this.initializeAvailabilePositions();
  }

  planAnimation() {
    // convert all paths to list of geometric objects that can be animated
    for (let i=0; i<this.paths.length; i++) {
      let len = this.paths[i].length;
      if (len >= 1) {
        this.objs.push(new Disk(
            this.gridToCanvasPt(this.paths[i][0]),
            DISK_RADIUS,
            START_COLOR));
        for (let j=1; j<len; j++) {
          this.objs.push(new Segment(
            this.gridToCanvasPt(this.paths[i][j-1]),
            this.gridToCanvasPt(this.paths[i][j]),
            MIDDLE_COLOR,
            SEGMENT_WIDTH));
          this.objs.push(new Disk(
            this.gridToCanvasPt(this.paths[i][j]),
            MIDDLE_RADIUS,
            MIDDLE_COLOR));
        }
        this.objs.push(new Disk(
          this.gridToCanvasPt(this.paths[i][len-1]),
          DISK_RADIUS,
          STOP_COLOR));
      }
    }
  }

  numAvailablePositions() {
    return this.availablePositions.flat().filter(p => p.avail == 1).length;
  }

  initializeAvailabilePositions() {
    let avails = [];
    for (let i=0; i<this.numRows; i++) {
      avails.push([]);
      for (let j=0; j<this.numCols; j++) {
        let availObj = {coords: [i, j], avail: 1};
        avails[i].push(availObj);
      }
    }
    return avails;
  }

  getAvailablePositions() {
    return this.availablePositions.flat().filter(p => p.avail == 1).map(p => p.coords);
  }

  gridToCanvas(i, j) {
    // map grid coordinates onto canvas coordinates
    return [this.sepX / 2 + i * this.sepX, this.sepY / 2 + j * this.sepY];
  }

  gridToCanvasPt(p) {
    return new Point(
      this.sepX / 2 + p.x * this.sepX,
      this.sepY / 2 + p.y * this.sepY
    );
  }

  drawReferencePoints() {
    arrayProduct(range(this.numRows), range(this.numCols))
      .map(t => this.gridToCanvas(t[0], t[1]))
      .forEach(p => canvasUtil.drawDisk(p[0], p[1], INITIAL_RADIUS, INITIAL_DISK_COLOR));
  }

  randomInitialPoint() {
    // select a random initial point for a path from a list of available points
    let avails = this.getAvailablePositions();
    if (avails.length > 0) {
      let [i, j] = avails[Math.floor(Math.random() * avails.length)];
      this.availablePositions[i][j].avail = 0;
      return [i, j];
    }
  }

  createPaths() {
    // populate the array of paths
    let numAvails = this.numAvailablePositions();
    while (numAvails > 0) {
      let [i, j] = this.randomInitialPoint();
      this.paths.push([new Point(i, j)]);
      let canExtendPath = true; //this.extendSegment();
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
    let p0 = this.paths[this.paths.length-1][lastPathLength-1];

    // adjacent points
    let avails = [[p0.x + 1, p0.y], [p0.x, p0.y - 1], [p0.x - 1, p0.y], [p0.x, p0.y + 1]]
      .filter(p => 0 <= p[0] && p[0] < this.numRows && 0 <= p[1] && p[1] < this.numCols)
      .filter(p => this.availablePositions[p[0]][p[1]].avail == 1);

    if (avails.length > 0) {
      let [i1, j1] = avails[Math.floor(Math.random() * avails.length)];
      this.availablePositions[i1][j1].avail = 0; // make it unavailable
      this.paths[this.paths.length-1].push(new Point(i1, j1));
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

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    sep = document.getElementById("spacing").value;
    canvasUtil.clearCanvas(BG_COLOR);
    grid = new Grid(WIDTH / sep, HEIGHT / sep, sep, sep);
    grid.drawReferencePoints();
    grid.createPaths();
    grid.planAnimation();
    count = 0;
    return setInterval(draw, 15);
  } else {
    alert('You need a better web browser to see this.'); }
}
