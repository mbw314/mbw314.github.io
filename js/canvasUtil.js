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
    // draw a circle at (x, y) with given radius, color (stroke instead of fill), and width
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


class Color {
  // triple of numbers representing an RGB color
  // useful for constructing colors programatically
  constructor(red, green, blue) {
    this.r = Math.round(red);
    this.g = Math.round(green);
    this.b = Math.round(blue);
  }

  static interpolate(c0, c1, t) {
    // if a color is a point in [0, 255] x [0, 255] x [0, 255], parametrize a line segment
    // between two colors by [0, 1], that is, c(t) = t * c1 + (1 - t) * c0,
    // and find the color c(t) at given parameter t.
    let r = (t * c1.r + (1.0 - t) * c0.r) % 256;
    let g = (t * c1.g + (1.0 - t) * c0.g) % 256;
    let b = (t * c1.b + (1.0 - t) * c0.b) % 256;
    return new Color(r, g, b);
  }

  static colorString(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
  }

  static random() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    return Color.colorString(r, g, b);
  }

  toString() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
}


class Point {
  constructor(x, y) {
    this.x = x; // float
    this.y = y; // float
  }

  translate(dir, dist) { // vec2d and float
    let unit_dir = dir.scale(1 / dir.norm());
    let new_x = this.x + unit_dir.x * dist;
    let new_y = this.y + unit_dir.y * dist;
    return new Point(new_x, new_y);
  }

  toString() {
    return ['(', this.x.toFixed(3), ', ', this.y.toFixed(3), ')'].join('');
  }

  distanceSq(p) {
    return (this.x - p.x) * (this.x - p.x) + (this.y - p.y) * (this.y - p.y);
  }

  distance(p) {
    return Math.sqrt(this.distanceSq(p));
  }



  scale(a) {
    return new Vec2D(a * this.x, a * this.y);
  }

  static centroid(points) { // list of Point objects
    let centroid_x = 0.0;
    let centroid_y = 0.0;
    for (let i in points) {
      centroid_x += points[i].x;
      centroid_y += points[i].y;
      //console.log('new centroid vals: ' + centroid_x + ', ' + centroid_y);
    }
    return new Point(centroid_x / points.length, centroid_y / points.length);
  }
}


class LineSegment {
  constructor(initial, terminal, width, color) {
    this.p0 = initial // Point
    this.p1 = terminal // Point
    this.width = width // int
    this.color = color // string
  }

  draw(canvasUtil) { // canvas context
    canvasUtil.drawLine(
      this.p0.x,
      this.p0.y,
      this.p1.x,
      this.p1.y,
      this.color,
      this.width);
  }

  toString() {
    return [
      this.p0.toString(), '->', this.p1.toString(),
      '; color =', this.color,
      '; width =', this.width].join(' ');
  }

  getMidpoint() {
    let x = (this.p0.x + this.p1.x) / 2.0;
    let y = (this.p0.y + this.p1.y) / 2.0;
    return new Point(x, y);
  }

  scale(a) {
    this.p0 = this.p0.scale(a);
    this.p1 = this.p1.scale(a);
  }

  translate(dir, dist) {
    this.p0 = this.p0.translate(dir, dist);
    this.p1 = this.p1.translate(dir, dist);
  }
}


class Vec2D extends Point {
  constructor(x, y) {
    super(x, y);
  }

  plus(v) {
    return new Vec2D(this.x + v.x, this.y + v.y);
  }

  minus(v) {
    return new Vec2D(this.x - v.x, this.y - v.y);
  }

  rotate(theta) { // radians
    let new_x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    let new_y = this.x * Math.sin(theta) + this.y * Math.cos(theta);
    return new Vec2D(new_x, new_y);
  }

  normSq() {
    return this.x * this.x + this.y * this.y;
  }

  norm() {
    return Math.sqrt(this.normSq());
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  toString() {
    return ['(', this.x.toFixed(3), ', ', this.y.toFixed(3), ')'].join('')
  }

  toUnitVector() {
    return this.scale(1.0 / this.norm());
  }
}
