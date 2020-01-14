const WIDTH = 750;
const HEIGHT = 750;
let canvas;
let ctx;
let canvasUtil;
let kme; // k-means ensemble
const NUM_POINTS = 75;
const POINT_RADIUS = 5;
const NUM_CLUSTERS = 5;
const CENTROID_RADIUS = 15;
const OLD_CENTROID_COLOR = "gray";


class KMeansEnsemble {
  constructor(numPoints, numClusters) {
    this.numPoints = numPoints;
    this.pointRadius = POINT_RADIUS;
    this.numClusters = numClusters;
    this.centroidRadius = CENTROID_RADIUS;
    this.points = []; // array of Vec2D
    this.pointColors = []; // array of string
    this.centroids = []; // array of Vec2D
    this.clusterColors = []; // array of string
    this.clusterIndexes = []; // array of int
    this.oldCentroids = []; // array of arrays of Vec2D
    this.oldCentroidColor = OLD_CENTROID_COLOR;
  }

  toString() {
    let clusters = `${this.numClusters} centroids: ${this.centroids.map(c => c.toString()).join(', ')}`;
    let clusterColors = `${this.numClusters} cluster colors: ${this.clusterColors.join(', ')}`;
    let points = `${this.numPoints} points: ${this.points.map(p => p.toString()).join(', ')}`;
    return [clusters, clusterColors, points].join('\n');
  }

  initPoints() {
    this.points = [];
    this.clusterIndexes = [];
    this.pointColors = [];
    for (let i=0; i<this.numPoints; i++) {
      this.points.push(new Vec2D(Math.random() * WIDTH, Math.random() * HEIGHT));
      this.clusterIndexes.push(0);
      this.pointColors.push("black");
    }
  }

  drawPoints() {
    for (let i=0; i<this.numPoints; i++) {
      //canvasUtil.println(`drawing point at ${this.points[i].toString()} with color ${this.pointColors[i]}`);
      canvasUtil.drawDisk(
        this.points[i].x,
        this.points[i].y,
        this.pointRadius,
        this.pointColors[i]
      );
    }
  }

  initCentroids() {
    this.centroids = [];
    this.clusterColors = [];
    this.oldCentroids = [];
    for (let k=0; k<this.numClusters; k++) {
      this.centroids.push(new Vec2D(Math.random() * WIDTH, Math.random() * HEIGHT));
      let r = Math.round(k * 255 / this.numClusters);
      let g = Math.round((this.numClusters - k) * 255 / this.numClusters);
      let b = Math.round(Math.random() * 255);
      this.clusterColors.push(Color.colorString(r, g, b));
      this.oldCentroids.push([]);
    }
  }

  drawCentroids() {
    for (let k=0; k<this.numClusters; k++) {
      //canvasUtil.println(`drawing cluster center ${k+1} of ${this.numClusters} at ${this.centroids[k].toString()} with color ${this.clusterColors[k]}`);
      canvasUtil.drawCircle(
        this.centroids[k].x,
        this.centroids[k].y,
        this.centroidRadius,
        this.clusterColors[k],
        2
      );
    }
  }

  initialize() {
    canvasUtil.clearCanvas();
    this.initPoints();
    this.initCentroids();
    this.drawPoints();
    this.drawCentroids();
  }

  drawConnectors() {
    for (let k=0; k<this.numClusters; k++) {
      let cluster = getAllIndexes(this.clusterIndexes, k);
      for (let j=0; j<cluster.length; j++) {
        canvasUtil.drawLine(
          this.centroids[k].x,
          this.centroids[k].y,
          this.points[cluster[j]].x,
          this.points[cluster[j]].y,
          'black',
          1
        );
      }
    }
  }

  drawCentroidPaths() {
    for (let k=0; k<this.numClusters; k++) {
      for (let j=0; j<this.oldCentroids[k].length-1; j++) {
        canvasUtil.drawLine(
          this.oldCentroids[k][j].x,
          this.oldCentroids[k][j].y,
          this.oldCentroids[k][j+1].x,
          this.oldCentroids[k][j+1].y,
          this.oldCentroidColor,
          1
        );

        canvasUtil.drawCircle(
          this.oldCentroids[k][j].x,
          this.oldCentroids[k][j].y,
          this.centroidRadius / 2,
          this.oldCentroidColor,
          1
        );

      }
      // optionally draw a segment from the last old centroid the the current one
      if (this.oldCentroids[k].length > 0) {
        canvasUtil.drawLine(
          this.oldCentroids[k][this.oldCentroids[k].length-1].x,
          this.oldCentroids[k][this.oldCentroids[k].length-1].y,
          this.centroids[k].x,
          this.centroids[k].y,
          this.oldCentroidColor,
          1
        );
      }
    }
  }

  iterate() {
    // step 1: cluster assignment
    for (let i=0; i<this.numPoints; i++) {
      // for each data point, find the index of the closest centroid
      let minDistSq = WIDTH * WIDTH + HEIGHT * HEIGHT; // largest possible distance from a point to a centroid
      let indexOfClosest = 0;
      for (let k=0; k<this.numClusters; k++) {
        let distSq = this.points[i].distanceSq(this.centroids[k]);
        if (distSq < minDistSq) {
          indexOfClosest = k;
          minDistSq = distSq;
        }
      }
      // find index corresponding to smallest distance, color point accordingly
      this.clusterIndexes[i] = indexOfClosest;
      this.pointColors[i] = this.clusterColors[this.clusterIndexes[i]];
    }

    // step 2: centroid movement
    for (let k=0; k<this.numClusters; k++) {
      this.oldCentroids[k].push(this.centroids[k]); // keep track of the previous position
      let cluster = getAllIndexes(this.clusterIndexes, k); // indices of points belonging to cluster k
      if (cluster.length != 0) {
        // replace centroid with the cluster average
        let pointsInCluster = cluster.map(i => this.points[i]);
        this.centroids[k] = Point.centroid(pointsInCluster);
      } else {
        // reassign the centroid randomly
        this.centroids[k] = new Vec2D(Math.random() * WIDTH, Math.random() * HEIGHT);
      }
    }
  }
}


function indexOfSmallest(a) {
  let lowest = 0;
  for (let i=1; i < a.length; i++) {
    if (a[i] < a[lowest]) {
      lowest = i;
    }
  }
  return lowest;
}

function countInArray(a, i) {
  let result = 0;
  for (let o in a) {
    if (a[o] == i) {
      result++;
    }
  }
  return result;
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
  kme.initialize();
}

function iterate() {
  canvasUtil.clearCanvas();
  kme.iterate();
  kme.drawConnectors();
  kme.drawCentroids();
  kme.drawCentroidPaths();
  kme.drawPoints();
}

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    kme = new KMeansEnsemble(NUM_POINTS, NUM_CLUSTERS);
    refreshData();
  }
  else {
    alert('You need a better web browser to see this.');
  }
}
