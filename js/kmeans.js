// TODO: refactor to use Point/Vec2D objects

var canvas;
var ctx;
var WIDTH = 750;
var HEIGHT = 750;

var m = 50;
var points = [];
var clusterIndex = [];
var pointColor = [];
var pointRadius = 10;
var K = 5;
var centroids = [];
var centroidColor = [];
var centroidRadius = 15;
var tempDist = [];
var oldCentroids = [];
var oldCentroidColor = 'gray';
var centroidLines = [];
var canvasUtil;


function indexOfSmallest(a) {
  var lowest = 0;
  for (let i=1; i < a.length; i++) {
    if (a[i] < a[lowest]) {
      lowest = i;
    }
  }
  return lowest;
}

function countInArray(a, i) {
  var result = 0;
  for (var o in a) {
    if (a[o] == i) {
      result++;
    }
  }
  return result;
}

function getAllIndexes(a, v) {
  var indexes = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === v) {
      indexes.push(i);
    }
  }
  return indexes;
}


function kMeansIter() {
  // step 1: cluster assignment
  for (let i=0; i<m; i++) {
    // for each data point, compute distances to all centroids
    for (let k=0; k<K; k++) {
      tempDist[k] = (points[i][0] - centroids[k][0]) * (points[i][0] - centroids[k][0])
          + (points[i][1] - centroids[k][1]) * (points[i][1] - centroids[k][1]);
    }
    // find index corresponding to smallest distance
    clusterIndex[i] = indexOfSmallest(tempDist);
    //set the color of the data point to the color of the new centroid
    pointColor[i] = centroidColor[clusterIndex[i]];
  }

  // step 2: centroid movement
  let tempX = 0;
  let tempY = 0;
  let cluster = [];

  for (let k=0; k<K; k++) {
    let L = oldCentroids.push([centroids[k][0], centroids[k][1]]);
    cluster = getAllIndexes(clusterIndex, k);
    if (cluster.length != 0) {
      // if the cluster is non-empty, proceed
      tempX = 0;
      tempY = 0;

      // calculate mean of all points in given cluster
      for (var j=0; j < cluster.length; j++) {
        tempX += points[cluster[j]][0];
        tempY += points[cluster[j]][1];
      }

      // move the centroid to this new mean
      centroids[k][0] = tempX / cluster.length;
      centroids[k][1] = tempY / cluster.length;
    } else {
      // reassign the centroid randomly
      centroids[k] = [Math.random() * WIDTH, Math.random() * HEIGHT];
    }

    L = centroidLines.push(
      [
        oldCentroids[oldCentroids.length - 1][0],
        oldCentroids[oldCentroids.length - 1][1],
        centroids[k][0],
        centroids[k][1]
      ]
    );
  }
}

function initPoints(num) {
  m = num;
  for (let i=0; i<m; i++) {
    points[i] = [Math.random() * WIDTH, Math.random() * HEIGHT];
    clusterIndex[i] = 0;
    pointColor[i] = [0, 0, 0];
  }
}

function initCentroids(num) {
  K = num;
  for (let k=0; k<K; k++) {
    centroids[k] = [Math.random() * WIDTH, Math.random() * HEIGHT];
    centroidColor[k] = [
      Math.round(k * 255 / K),
      Math.round((K - k) * 255 / K),
      Math.round(Math.random() * 255)];
  }
}

function drawPoints() {
  for (let i=0; i<m; i++) {
    canvasUtil.drawDisk(
      points[i][0],
      points[i][1],
      pointRadius,
      Color.colorString(pointColor[i][0], pointColor[i][1], pointColor[i][2])
    );
  }
}

function drawCentroids() {
  for (let k=0; k<K; k++) {
    canvasUtil.drawCircle(
      centroids[k][0],
      centroids[k][1],
      centroidRadius,
      Color.colorString(centroidColor[k][0], centroidColor[k][1], centroidColor[k][2]),
      1
    );
  }

  for (let j=0; j<oldCentroids.length; j++) {
    canvasUtil.drawCircle(
      oldCentroids[j][0],
      oldCentroids[j][1],
      centroidRadius/2,
      oldCentroidColor,
      1
    );
  }
}

function drawCentroidPaths() {
  for (let j=0; j<centroidLines.length; j++) {
    canvasUtil.drawLine(
      centroidLines[j][0],
      centroidLines[j][1],
      centroidLines[j][2],
      centroidLines[j][3],
      oldCentroidColor,
      1
    );
  }
}

function drawConnectors() {
  let cluster = [];
  for (let k=0; k<K; k++) {
    cluster = getAllIndexes(clusterIndex, k);
    for (let j=0; j<cluster.length; j++) {
      canvasUtil.drawLine(
        centroids[k][0],
        centroids[k][1],
        points[cluster[j]][0],
        points[cluster[j]][1],
        'black',
        1
      );
    }
  }
}


function refreshData() {
  canvasUtil.clearCanvas();
  oldCentroids = [];
  centroidLines = [];
  initPoints(m);
  drawPoints();
  initCentroids(K);
  drawCentroids();
}

function iterate() {
  canvasUtil.clearCanvas();
  kMeansIter();
  drawConnectors();
  drawCentroids();
  drawCentroidPaths();
  drawPoints();
}

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    canvasUtil.clearCanvas();
    refreshData();
  }
  else { alert('You need a better web browser to see this.'); }
}
