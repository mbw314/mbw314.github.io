var x = 1;
var y = 1;
var M = 4000;

var x0, y0;

var p_x;
var p_y;
var v_x;
var v_y;
var a_x;
var a_y;
var r_squared;
var rad;

var m = 1;
var G = 1/10;
var grav = 1;
var a_g = 2;
var K = 3;

var sep = 50;	// separation of vectors (vertical and horizontal)
var mode = 1;
var away = 1;


var canvas, ctx;
var width = 750;
var height = 750;
var diag = Math.sqrt(width*width + height*height);  // diagonal length of canvas

var canvasMinX;
var canvasMinY;



function setupArrays() {

	rad = 0.9*sep;

	x0 = new Array(width/sep + 3);
	y0 = new Array(width/sep + 3);
	p_x = new Array(width/sep + 3);
	p_y = new Array(width/sep + 3);
	v_x = new Array(width/sep + 3);
	v_y = new Array(width/sep + 3);
	a_x = new Array(width/sep + 3);
	a_y = new Array(width/sep + 3);
	sin_theta = new Array(width/sep + 3);
	cos_theta = new Array(width/sep + 3);
	r_squared = new Array(width/sep + 3);

	for(var i=0; i<width/sep + 3; i++) {
		x0[i] = new Array(height/sep + 3);
		y0[i] = new Array(height/sep + 3);
		p_x[i] = new Array(height/sep + 3);
		p_y[i] = new Array(height/sep + 3);
		v_x[i] = new Array(height/sep + 3);
		v_y[i] = new Array(height/sep + 3);
		a_x[i] = new Array(height/sep + 3);
		a_y[i] = new Array(height/sep + 3);
		sin_theta[i] = new Array(height/sep + 3);
		cos_theta[i] = new Array(height/sep + 3);
		r_squared[i] = new Array(height/sep + 3);

		for(var j=0; j < height/sep + 3; j++) {
			x0[i][j] = i*sep-sep;
			y0[i][j] = j*sep-sep;
			p_x[i][j] = x0[i][j]+rad;
			p_y[i][j] = y0[i][j];
			v_x[i][j] = 0;
			v_y[i][j] = 0;
			a_x[i][j] = 0;
			a_y[i][j] = 0;
			sin_theta[i][j] = 0;
			cos_theta[i][j] = 0;
			r_squared[i][j] = 0;
		}
	}
}

function draw() {

	clear();

	// if anything changed, update the variables and reset the arrays
	if( away != document.getElementById("direction").value ||
	    sep  != document.getElementById("separation").value*1 ||
		mode != document.getElementById("style").value*1) {

		away = document.getElementById("direction").value;
		sep  = document.getElementById("separation").value*1;
		mode = document.getElementById("style").value*1;

		setupArrays();
	}

	if( mode == 0 ) { // vectors of boudned length
		for(var i = 0 - sep; i <= width + sep; i = i + sep) {
			for(var j = 0 - sep; j <= height + sep; j = j + sep) {
				var dist = Math.sqrt( (i-x)*(i-x) + (j-y)*(j-y) );

				ctx.strokeStyle = 'rgb('	+ Math.round(255-255*x/width) + ','
											+ Math.round(255*dist/diag) + ','
											+ Math.round(255*y/height) + ')';

				line(i,j,i+(x-i)*Math.min(0.9*sep/dist,1/2)*away,j+(y-j)*Math.min(0.9*sep/dist,1/2)*away);
				circle(i,j,2);
			}
		}
	}
	else if( mode == 1 ) { // vectors that remember their last direction (when outside range of mouse)
		for(var i=0; i < width/sep + 3; i++) {
			for(var j=0; j < height/sep + 3; j++) {

				r_squared[i][j] = (p_x[i][j]-x)*(p_x[i][j]-x) + (p_y[i][j]-y)*(p_y[i][j]-y);
				if( r_squared[i][j] < K*K*sep*sep ) {

					// forces from the mouse and gravity
					a_x[i][j] = (G*M/r_squared[i][j] - 1/(K*K*sep*sep))*(x-p_x[i][j])*away;
					a_y[i][j] = (G*M/r_squared[i][j] - 1/(K*K*sep*sep))*(y-p_y[i][j])*away;

					// take velocities into account
					v_x[i][j] += a_x[i][j];
					v_y[i][j] += a_y[i][j];

					// endpoint of vector
					var x1 = p_x[i][j] + v_x[i][j];
					var y1 = p_y[i][j] + v_y[i][j];

					// project the endpoint onto a sphere around the base point
					p_x[i][j] = Math.min(rad,Math.sqrt(r_squared[i][j]))*(x1 - x0[i][j])
								/Math.sqrt( (x1-x0[i][j])*(x1-x0[i][j])	+ (y1-y0[i][j])*(y1-y0[i][j]) ) + x0[i][j];
					p_y[i][j] = Math.min(rad,Math.sqrt(r_squared[i][j]))*(y1 - y0[i][j])
								/Math.sqrt( (x1-x0[i][j])*(x1-x0[i][j]) + (y1-y0[i][j])*(y1-y0[i][j]) ) + y0[i][j];

					ctx.strokeStyle = 'rgb('	+ Math.round( 255-255*r_squared[i][j]/(K*K*sep*sep))  + ','
												+ 0 + ','
												+ Math.round( 255*r_squared[i][j]/(K*K*sep*sep) ) + ')';
				}
				else { // far from mouse, so there is no velocity
					v_x[i][j] = 0;
					v_y[i][j] = 0;

					ctx.strokeStyle = 'rgb(' + 0 + ',' + 0 + ',' + Math.round( 255*K*K*sep*sep/r_squared[i][j] )  + ')';
				}

				circle(x0[i][j],y0[i][j],2);
				line(x0[i][j],y0[i][j],p_x[i][j],p_y[i][j]);
			}
		}
	}
	else {

		grav = mode - 2;  // gravity on if mode = 3, off if mode = 2

		for(var i=0; i < width/sep + 3; i++) {
			for(var j=0; j < height/sep + 3; j++) {

				// forces from the mouse and gravity
				r_squared[i][j] = (p_x[i][j]-x)*(p_x[i][j]-x) + (p_y[i][j]-y)*(p_y[i][j]-y);
				a_x[i][j] = G*(M/r_squared[i][j])*(x-p_x[i][j])*away;
				a_y[i][j] = G*(M/r_squared[i][j])*(y-p_y[i][j])*away + grav*a_g;

				// take velocities into account
				v_x[i][j] = a_x[i][j];
				v_y[i][j] = a_y[i][j];

				// endpoint of vector
				var x1 = p_x[i][j] + v_x[i][j];
				var y1 = p_y[i][j] + v_y[i][j];

				// project the endpoint onto a sphere around the base point
				p_x[i][j] = Math.min(rad,Math.sqrt(r_squared[i][j]))*(x1 - x0[i][j])
							/Math.sqrt( (x1-x0[i][j])*(x1-x0[i][j]) + (y1-y0[i][j])*(y1-y0[i][j]) ) + x0[i][j];
				p_y[i][j] = Math.min(rad,Math.sqrt(r_squared[i][j]))*(y1 - y0[i][j])
							/Math.sqrt( (x1-x0[i][j])*(x1-x0[i][j]) + (y1-y0[i][j])*(y1-y0[i][j]) ) + y0[i][j];

				var a_norm_squared = a_x[i][j]*a_x[i][j] + (a_y[i][j]-grav*a_g)*(a_y[i][j]-grav*a_g)
				ctx.strokeStyle = 'rgb('	+ Math.round( (255*2/Math.PI)*Math.atan(a_norm_squared) ) + ','
											+ 0 + ','
											+ Math.round( 255-(255*2/Math.PI)*Math.atan(a_norm_squared) ) + ')';

				circle(x0[i][j],y0[i][j],2);
				line(x0[i][j],y0[i][j],p_x[i][j],p_y[i][j]);
			}
		}
	}
}


function ev_mousemove (ev) {
	// Get the mouse position relative to the canvas element.
	if (ev.layerX || ev.layerX == 0) { // Firefox
		x = ev.layerX - canvasMinX;
		y = ev.layerY - canvasMinY;
	} else if (ev.offsetX || ev.offsetX == 0) { // Opera
		x = ev.offsetX - canvasMinX;
		y = ev.offsetY - canvasMinY;
	}
	document.getElementById("x-coord").value = x;
	document.getElementById("y-coord").value = y;
}

function circle(x,y,r) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.stroke();
}

function rect(x,y,w,h) {
	ctx.beginPath();
	ctx.rect(x,y,w,h);
	ctx.closePath();
	ctx.fill();
}

function line(x0,y0,x1,y1) {
	ctx.beginPath();
	ctx.moveTo(x0,y0);
	ctx.lineTo(x1,y1);
	ctx.closePath();
	ctx.stroke();
}

function clear() {
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.beginPath();
	ctx.rect(0, 0, width, height);
	ctx.closePath();
	ctx.fill();
}


// find the position of the upper-left corner of an object (e.g., the canvase)
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


function init() {

	// get the canvas element using the DOM
	canvas = document.getElementById("canvas");
	canvas.width = width;
	canvas.height = height;

	canvasMinX = findPos(canvas)[0];
	canvasMinY = findPos(canvas)[1];

	// Make sure we don't execute when canvas isn't supported
	if (canvas.getContext){
		// use getContext to use the canvas for drawing
		ctx = canvas.getContext('2d');

		// Attach the mousemove event handler.
		canvas.addEventListener('mousemove', ev_mousemove, false);

		x0 = width/2;
		y0 = height/2;

		// set up arrays
		setupArrays();

		// call the drawing function
		return setInterval(draw, 10);
	}
	else { alert('You need a better web browser to see this.'); }
}
