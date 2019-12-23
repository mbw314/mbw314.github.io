var canvas;
var ctx;
var WIDTH = 750;
var HEIGHT = 750;
var posX, posY, mouseX, mouseY;

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


function indexOfSmallest(a) {
	var lowest = 0;
	for(var i=1; i < a.length; i++) {
  		if (a[i] < a[lowest]) lowest = i;
 	}
 	return lowest;
}

function countInArray(a,i){
	var result = 0;

	for(var o in a) {
		if(a[o] == i) {
			result++;
		}
	}
	return result;
}

function getAllIndexes(a, v) {
    var indexes = [], i;
    for(i = 0; i < a.length; i++)
        if (a[i] === v)
            indexes.push(i);
    return indexes;
}


function kMeansIter() {

	// step 1: cluster assignment
	for(var i=0; i<m; i++) {
		// for each data point, compute distances to all centroids
		for(var k=0; k<K; k++) {
			tempDist[k] = (points[i][0]-centroids[k][0])*(points[i][0]-centroids[k][0])
					+ (points[i][1]-centroids[k][1])*(points[i][1]-centroids[k][1]);
		}
		// find index corresponding to smallest distance
		clusterIndex[i] = indexOfSmallest(tempDist);
		//set the color of the data point to the color of the new centroid
		pointColor[i] = centroidColor[clusterIndex[i]];
	}

	// step 2: centroid movement
	var tempX = 0;
	var tempY = 0;
	var cluster = [];

	for(var k=0; k<K; k++) {

		var L = oldCentroids.push([centroids[k][0],centroids[k][1]]);

		cluster = getAllIndexes(clusterIndex,k);

		if( cluster.length != 0 ) {
			// if the cluster is non-empty, proceed
			tempX = 0;
			tempY = 0;

			// calculate mean of all points in given cluster
			for(var j=0; j < cluster.length; j++) {
				tempX += points[cluster[j]][0];
				tempY += points[cluster[j]][1];
			}

			// move the centroid to this new mean
			centroids[k][0] = tempX/cluster.length;
			centroids[k][1] = tempY/cluster.length;
		}
		else {
			// if the cluster is empty, remove the corresponding centroid
			//var removed = centroids.splice(k,1);
			//k = k-1;

			// reassign the centroid randomly
			centroids[k] = [Math.random()*WIDTH, Math.random()*HEIGHT];
		}

		L = centroidLines.push([oldCentroids[oldCentroids.length-1][0],
						    oldCentroids[oldCentroids.length-1][1],
						    centroids[k][0],
						    centroids[k][1]]);
	}
}

function initPoints(num) {

	m = num;
	for(var i=0; i<m; i++) {
		points[i] = [Math.random()*WIDTH, Math.random()*HEIGHT];
		clusterIndex[i] = 0;
		pointColor[i] = [0, 0, 0];
	}
}

function initCentroids(num) {

	K = num;
	for(var k=0; k<K; k++) {
		centroids[k] = [Math.random()*WIDTH, Math.random()*HEIGHT];
				 //= [points[k][0], points[k][1]];
		centroidColor[k] = [Math.round(k*255/K),
						Math.round((K-k)*255/K),
						Math.round(Math.random()*255)];
	}
}


function drawPoints() {

	for(var i=0; i<m; i++) {
		drawDot(points[i][0],
			   points[i][1],
			   pointRadius,
			   'rgb(' + pointColor[i][0] + ','
			   + pointColor[i][1] + ','
			   + pointColor[i][2] + ')');
	}
}

function drawCentroids() {

	for(var k=0; k<K; k++) {
		drawCircle(centroids[k][0],
			      centroids[k][1],
			      centroidRadius,
			      'rgb(' + centroidColor[k][0] + ','
			      + centroidColor[k][1] + ','
			      + centroidColor[k][2] + ')');
	}

	for(var j=0; j<oldCentroids.length; j++) {
		drawCircle(oldCentroids[j][0],
			      oldCentroids[j][1],
			      centroidRadius/2,
			      oldCentroidColor);
	}

}

function drawCentroidPaths() {

	for(var j=0; j<centroidLines.length; j++) {
		drawLine(centroidLines[j][0],
			    centroidLines[j][1],
			    centroidLines[j][2],
			    centroidLines[j][3],
			    oldCentroidColor);
	}
}

function drawConnectors() {

	var cluster = [];

	for(var k=0; k<K; k++) {

		cluster = getAllIndexes(clusterIndex,k);

		for(var j=0; j<cluster.length; j++) {

			drawLine(centroids[k][0],
					centroids[k][1],
					points[cluster[j]][0],
					points[cluster[j]][1],
					'black');
		}

	}
}

function rect(x,y,w,h) {
	ctx.beginPath();
	ctx.rect(x,y,w,h);
	ctx.closePath();
	ctx.fill();
}

function clear() {
	ctx.fillStyle = 'white';
	rect(0, 0, WIDTH, HEIGHT);
}

function drawLine(x0,y0,x1,y1,c) {
	ctx.beginPath();
	ctx.strokeStyle = c;
	ctx.moveTo(x0,y0);
	ctx.lineTo(x1,y1);
	ctx.closePath();
	ctx.stroke();
}

function drawDot(x,y,r,c) {
	ctx.beginPath();
	ctx.fillStyle = c;
	ctx.arc(x,y,r,0,2*Math.PI,true);
	ctx.closePath();
	ctx.fill();
}

function drawCircle(x,y,r,c) {
	ctx.beginPath();
	ctx.strokeStyle = c;
	ctx.arc(x,y,r,0,2*Math.PI,true);
	ctx.closePath();
	ctx.stroke();
}


// find the position of the upper-left corner of an object (e.g., the canvas)
function findPos(obj) {
	var curLeft = 0;
	var curTop = 0;

	if(obj.offsetParent) {
		do {
			curLeft += obj.offsetLeft;
			curTop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}

	return [curLeft,curTop];
}

function refreshData() {

	clear();

	oldCentroids = [];
	centroidLines = [];

	initPoints(m);
	drawPoints();

	initCentroids(K);
	drawCentroids();
}

function iterate() {

	clear();
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
		refreshData();
	}
	else { alert('You need a better web browser to see this.'); }
}
