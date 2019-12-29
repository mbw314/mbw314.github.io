// need global var for the output text field

function println(msg) {
  // print a message to the text field and the console
  output_field.value += msg + '\n';
  console.log(msg);
}

function clear_text() {
  // clear the text field
  output_field.value = "";
}


// used in mandelbrot, but probably very inefficient. does not use paths.
// function fillPixel(x, y, c) {
// 	ctx.fillStyle = c;
// 	ctx.fillRect(x, y, 1, 1);
// }
//
class CanvasUtil {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  toString() {
    return `w = ${this.width}; h = ${this.height}`;
  }

  drawDisk(x, y, radius, color) {
    // draw a disk (filled circle) at (x, y) with given radius and color (fill instead of stroke)
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawRect(x, y, width, height, color) {
    // draw a rectangle at (x, y) with given width, height, and color
  	this.ctx.beginPath();
    this.ctx.fillStyle = color;
  	this.ctx.rect(x, y, width, height);
  	this.ctx.closePath();
  	this.ctx.fill();
  }

  drawCircle(x, y, radius, color, width) {
    // darw a circle at (x, y) with given radius, color (stroke instead of fill), and width
  	this.ctx.beginPath();
    this.ctx.lineWidth = width;
  	this.ctx.strokeStyle = color;
  	this.ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
  	this.ctx.closePath();
  	this.ctx.stroke();
  }

  drawLine(x0, y0, x1, y1, color, width) {
    // draw a line segment from (x0, y0) to (x1, y1) with given color and width
  	this.ctx.beginPath();
    this.ctx.lineWidth = width;
  	this.ctx.strokeStyle = color;
  	this.ctx.moveTo(x0, y0);
  	this.ctx.lineTo(x1, y1);
  	this.ctx.closePath();
  	this.ctx.stroke();
  }

  clear_canvas() {
    // clear the canvas by drawing a white rectangle with the same dimensions as the canvas
    //this.drawRect(0, 0, this.width, this.height, "white");
    this.ctx.beginPath();
    this.ctx.fillStyle = "white ";
  	this.ctx.rect(0, 0, this.width, this.height);
  	this.ctx.closePath();
  	this.ctx.fill();
  }

  ev_mousemove (evt, canvas) {
    // get mouse position
    const rect = canvas.getBoundingClientRect();
    x = etv.clientX - rect.left;
    y = evt.clientY - rect.top;
    // optionally print
    // document.getElementById("x-coord").value = x;
  	// document.getElementById("y-coord").value = y;
  }
}
