const WIDTH = 750;
const HEIGHT = 750;
let canvas;
let ctx;
let canvasUtil;
let kme; // k-means ensemble
const BLACK = Color.colorString(0, 0, 0);
const NUM_POINTS = 75;
const POINT_RADIUS = 5;
const NUM_CLUSTERS = 5;
const CENTROID_RADIUS = 15;
const OLD_CENTROID_COLOR = "gray";


class KMeansPoint {
  constructor(pos, color, clusterIndex) {
    this.pos = pos; // Point
    this.color = color; // String
    this.radius = POINT_RADIUS;
    this.clusterIndex = 0;
  }

  draw() {
    canvasUtil.drawDisk(this.pos.x, this.pos.y, this.radius, this.color);
  }
}

class KMeansCentroid {
  constructor(pos, color, radius, index) {
    this.pos = pos; // Point
    this.color = color;
    this.radius = radius;
    this.index = index;
    this.history = []; // Array of Point objects
  }

  draw() {
    // draw the history points and lines connecting them
    for (let j=0; j<this.history.length-1; j++) {
      canvasUtil.drawLine(
        this.history[j].x,
        this.history[j].y,
        this.history[j+1].x,
        this.history[j+1].y,
        OLD_CENTROID_COLOR,
        1
      );
      canvasUtil.drawCircle(
        this.history[j].x,
        this.history[j].y,
        this.radius / 2,
        OLD_CENTROID_COLOR,
        1
      );
    }
    // optionally draw a segment from the last old centroid the the current one
    if (this.history.length > 0) {
      canvasUtil.drawLine(
        this.history[this.history.length-1].x,
        this.history[this.history.length-1].y,
        this.pos.x,
        this.pos.y,
        OLD_CENTROID_COLOR,
        1
      );
    }
    // draw the centroid itself
    canvasUtil.drawCircle(this.pos.x, this.pos.y, this.radius, this.color);
  }
}

class KMeansEnsemble {
  constructor() {
    this.points = []; // Array of KMeansPoint objects
    this.centroids = []; // Array of KMeansCentroid objects
    this.numPoints = 0;
    this.numCentroids = 0;
  }

  initialize(numPoints, numClusters) {
    this.initPoints(numPoints);
    this.initCentroids(numClusters);
    canvasUtil.clearCanvas();
    this.drawPoints();
    this.drawCentroids();
  }

  initPoints(numPoints) {
    this.numPoints = numPoints;
    this.points = [];
    for (let i=0; i<numPoints; i++) {
      this.points.push(new KMeansPoint(new Vec2D(Math.random() * WIDTH, Math.random() * HEIGHT), BLACK, 0));
    }
  }

  drawPoints() {
    this.points.forEach(p => p.draw());
  }

  initCentroids(numCentroids) {
    this.numCentroids = numCentroids;
    this.centroids = [];
    for (let k=0; k<numCentroids; k++) {
      // choose initial position and color randomly
      let p = new Vec2D(Math.random() * WIDTH, Math.random() * HEIGHT);
      let r = Math.round(k * 255 / numCentroids);
      let g = Math.round((numCentroids - k) * 255 / numCentroids);
      let b = Math.floor(Math.random() * 256);
      let c = Color.colorString(r, g, b);
      this.centroids.push(new KMeansCentroid(p, c, CENTROID_RADIUS, k));
    }
  }

  drawCentroids() {
    this.centroids.forEach(c => c.draw());
  }

  drawConnectors() {
    for (let i=0; i<this.numPoints; i++) {
      canvasUtil.drawLine(
        this.centroids[this.points[i].clusterIndex].pos.x,
        this.centroids[this.points[i].clusterIndex].pos.y,
        this.points[i].pos.x,
        this.points[i].pos.y,
        BLACK,
        1
      );
    }
  }

  iterate() {
    // step 1: cluster assignment
    for (let i=0; i<this.numPoints; i++) {
      // for each data point, find the index of the closest centroid
      let minDistSq = WIDTH * WIDTH + HEIGHT * HEIGHT; // largest possible distance from a point to a centroid
      let indexOfClosest = 0;
      for (let k=0; k<this.numCentroids; k++) {
        let distSq = this.points[i].pos.distanceSq(this.centroids[k].pos);
        if (distSq < minDistSq) {
          indexOfClosest = k;
          minDistSq = distSq;
        }
      }
      // find index corresponding to smallest distance, color point accordingly
      this.points[i].clusterIndex = indexOfClosest;
      this.points[i].color = this.centroids[indexOfClosest].color;
    }

    // step 2: centroid movement
    for (let k=0; k<this.numCentroids; k++) {
      this.centroids[k].history.push(this.centroids[k].pos); // keep track of the previous position
      let cluster = getAllIndexes(this.points.map(p => p.clusterIndex), k); // indices of points belonging to cluster k
      if (cluster.length != 0) {
        // replace centroid with the cluster average
        let pointsInCluster = cluster.map(i => this.points[i].pos);
        this.centroids[k].pos = Point.centroid(pointsInCluster);
      } else {
        // reassign the centroid randomly
        this.centroids[k].pos = new Vec2D(Math.random() * WIDTH, Math.random() * HEIGHT);
      }
    }
  }
}


function getAllIndexes(a, v) {
  let indexes = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === v) {
      indexes.push(i);
    }
  }
  return indexes;
}

function refreshData() {
  canvasUtil.clearCanvas();
  kme.initialize(NUM_POINTS, NUM_CLUSTERS);
}

function iterate() {
  canvasUtil.clearCanvas();
  kme.iterate();
  kme.drawConnectors();
  kme.drawCentroids();
  kme.drawPoints();
}

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    kme = new KMeansEnsemble();
    refreshData();
  }
  else {
    alert('You need a better web browser to see this.');
  }
}
