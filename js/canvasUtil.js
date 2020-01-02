class CanvasUtil {
  constructor(ctx, width, height, output_field) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.output_field = output_field;
  }

  println(msg) {
    // print a message to the text field and the console
    this.output_field.value += msg + '\n';
    console.log(msg);
  }

  clearText() {
    // clear the text field
    this.output_field.value = "";
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

  clearCanvas(color) {
    // clear the canvas by drawing a rectangle (with an optional color) with the same dimensions as the canvas
    this.ctx.beginPath();
    if (color) {
      this.ctx.fillStyle = color;
    } else {
      this.ctx.fillStyle = "white";
    }
    this.ctx.rect(0, 0, this.width, this.height);
    this.ctx.closePath();
    this.ctx.fill();
  }
}
