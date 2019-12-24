// need global var for the output text field

function println(msg) {
  // print a message to the text field and the console
  output_field += msg + '\n';
  console.log(msg);
}

function clear_text() {
  // clear the text field
  output_field = "";
}


// used in mandelbto, but probably very inefficient. does not use paths.
function fillPixel(x, y, c) {
	ctx.fillStyle = c;
	ctx.fillRect(x, y, 1, 1);
}

// drawDisk
function drawDisk(x, y, radius, color) {
  // draw a disk (filled circle) at (x, y) with given radius and color (fill instead of stroke)
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y ,radius, 0, 2*Math.PI, true);
  ctx.closePath();
  ctx.fill();
}

// rect
function drawRect(x, y, width, height, color) {
  // draw a rectangle at (x, y) with given width and height, should we include a color?
	ctx.beginPath();
  ctx.fillStyle = color;
	ctx.rect(x, y, width, height);
	ctx.closePath();
	ctx.fill();
}


// circle
// vectors, graph, particles are slightly different
function drawCircle(x, y, radius, color) {
  // darw a circle at (x, y) with given radius and color (stroke instead of fill) (do we need a thickness param?)
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.arc(x, y, radius, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.stroke();
}

// line
// vectors is different
function drawLine(x0, y0, x1, y1, color) {
  // draw a line segment from (x0, y0) to (x1, y1) with given color (do we need a width parameter?)
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.closePath();
	ctx.stroke();
}

// clear
// all seem to use this differently
// this depends on having HEIGHT and WIDTH as global vars
function clear_canvas() {
  // clear the canvas by drawing a white rectangle with the same dimensions as the canvas
  drawRect(0, 0, WIDTH, HEIGHT, "white");
}


// get mouse position
function ev_mousemove (ev) {
  const rect = canvas.getBoundingClientRect()
  x = ev.clientX - rect.left
  y = ev.clientY - rect.top
  // optionally print
  // document.getElementById("x-coord").value = x;
	// document.getElementById("y-coord").value = y;
}
