
var canvas;
var ctx;
var WIDTH = 750;
var HEIGHT = 750;
var posX, posY, mouseX, mouseY;

var M = 100;
var Jlin = [1000000];
var Jquad = [1000000];
var x = [];
var y = [];
var alpha = 1;
var t0_init = 0;
var t1_init = 0;
var t2_init = 1;
var spread = 0;
var m = [];
var b = [];
var t0 = [];
var t1 = [];
var t2 = [];
var pointColor = 'black';
var pointRadius = 5;
var linear = 1;
var quadratic = 0;

function gdIter() {

	var Jlin_temp = 0; //cost function for linear regression
	var J_m = 0; //partial derivative of Jlin w.r.t. m
	var J_b = 0; //partial derivative of Jlin w.r.t. b

	var Jquad_temp = 0; //cost function for quadratic regression
	var J_2 = 0; //partial derivative of Jquad w.r.t. t2
	var J_1 = 0; //partial derivative of Jquad w.r.t. t1
	var J_0 = 0; //partial derivative of Jquad w.r.t. t0

	var L = t2.length; //# of iterations

	// calculate the gradient of cost
	for(var i=0; i<M; i++) {

		// (signed) vertical distance between data point
		// and current regression line: h(x)-y = mx + b - y
		var diff_lin = m[L-1]*x[i] + b[L-1] - y[i];

		J_m       += diff_lin*x[i];
		J_b       += diff_lin;
		Jlin_temp += diff_lin*diff_lin;

		// (signed) vertical distance between data point
		// and current regression line: h(x)-y = t2 x^2 + t1 x + t0 - y
		var diff_quad = t2[L-1]*x[i]*x[i] + t1[L-1]*x[i] + t0[L-1] - y[i];

		J_2       += diff_quad*x[i]*x[i];
		J_1       += diff_quad*x[i];
		J_0       += diff_quad;
		Jlin_temp += diff_quad*diff_quad;
	}

	// update Jlin, m, and b based on the gradient
	Jlin[L] = Jlin_temp/(2*M);
	m[L] = m[L-1] - alpha*J_m/M;
	b[L] = b[L-1] - alpha*J_b/M;

	// update J, m, and b based on the gradient
	Jquad[L] = Jquad_temp/(2*M);
	t2[L] = t2[L-1] - alpha*J_2/M;
	t1[L] = t1[L-1] - alpha*J_1/M;
	t0[L] = t0[L-1] - alpha*J_0/M;

}


function refreshData() {
	//document.outform.output.value = "";

	// usual starting data
	m = [0];
	b = [Math.random()];

	t2 = [0];
	t1 = [0];
	t0 = [Math.random()];

	clear();
	initPoints(M);
	drawPoints();
	drawLines();
}


function iterate2() {
	clear();
	gdIter();
	drawPoints();
	drawLines();
	drawVerts();
}


function drawAfterChange() {
	clear();
	drawPoints();
	drawLines();
	drawVerts();
}


function initPoints() {

	// create M points 'near' the line y = t2_init * x^2 + t1_init * x + t0_init
	for(var i=0; i<M; i++) {
		x[i] = Math.random();
		y[i] = t2_init*x[i]*x[i] + t1_init*x[i] + t0_init
			   + (2*Math.random()-1)*spread*Math.random();
	}
}


function drawPoints() {
	for(var i=0; i<M; i++)
		drawDot(x[i]*WIDTH,
			y[i]*HEIGHT,
			pointRadius,
			pointColor);
}


function drawVerts() {
	var L = t2.length;
	for(var i=0; i<M; i++) {
		if( document.controls.regtype.value == "lin" )
			drawLine(x[i]*WIDTH,
				 y[i]*HEIGHT,
				 x[i]*WIDTH,
				 (m[L-1]*x[i] + b[L-1])*HEIGHT,
				 'red');

		if( document.controls.regtype.value == "quad" )
			drawLine(x[i]*WIDTH,
				y[i]*HEIGHT,
				x[i]*WIDTH,
				(t2[L-1]*x[i]*x[i] + t1[L-1]*x[i] + t0[L-1])*HEIGHT,
				'red');
	}
}


function drawLines() {
	var L = t2.length;

	// draw all but final line, scaling the color from light to dark
	for(var i=0; i<L-1; i++) {

		// evenly divide interval [0,255] and step through backwards
		var c = Math.round((L-i)*255/L);

		if( document.controls.regtype.value == "lin" )
			drawLine(0,
				b[i]*HEIGHT,
				1*WIDTH,
				(m[i]*1 + b[i])*HEIGHT,
				'rgb(' + c + ',' + c + ',' + c + ')');
		if( document.controls.regtype.value == "quad" )
			for(var j=0; j<WIDTH; j++)
				drawDot(j,
					(t2[i]*j*j/(WIDTH*WIDTH) + t1[i]*j/WIDTH + t0[i])*HEIGHT,
					1,
					'rgb(' + c + ',' + c + ',' + c + ')');
	}

	// draw the final line in black
	if( document.controls.regtype.value == "lin" )
		drawLine(0,
			b[L-1]*HEIGHT,
			1*WIDTH,
			(m[L-1]*1 + b[L-1])*HEIGHT,
			'black');
	if( document.controls.regtype.value == "quad" )
		for(var j=0; j<WIDTH; j++)
			drawDot(j,
				(t2[L-1]*j*j/(WIDTH*WIDTH) + t1[L-1]*j/WIDTH + t0[L-1])*HEIGHT,
				1,
				'black');
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


function init(){
	canvas = document.getElementById("canvas");
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	if (canvas.getContext){
		ctx = canvas.getContext('2d');

		// parameters to create the random data
		// A(x-B)^2+C = Ax^2 -2ABx + AB^2+C
		t0_init = 0.8;
		t1_init = 0;
		t2_init = -1;
		spread = 0.25;

		refreshData();
	}
	else alert('You need a better web browser to see this.');
}
