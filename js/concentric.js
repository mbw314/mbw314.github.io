let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;

let shapes = [];
const MAX_NUM_SHAPES = 500;

const MIN_RADIUS = 2;
const RADIUS_INCREMENT = 0.01; // how much does the radius increase during each animation step
const ANGLE_INCREMENT = 2 * Math.PI / 253; // how much does the angle increase during each animation step
let filling = true;
let constAngle = false;

const SIDES_MIN = 3;
const SIDES_MAX = 10;
const SIDES_DEFAULT = 4;
let numSides = SIDES_DEFAULT;
function fundamental_angle() {
  // angle of 1 sector of the n-gon
  return 2 * Math.PI / numSides;
}

const OFFSET_MIN = 0.01;
function offset_max() {
  return 0.5 * fundamental_angle() - 0.01;
}
const OFFSET_DEFAULT = fundamental_angle() / 4;
let offset = OFFSET_DEFAULT;  // how much is each polygon rotated compared to the previous

const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

const COLORS = [...Array(MAX_NUM_SHAPES).entries()].map(n => Color.random().toString());
// const COLOR1 = Color.random().toString();
// const COLOR2 = Color.random().toString()
// const COLORS = [...Array(MAX_NUM_SHAPES).keys()].map(n => n % 2 == 0 ? COLOR1 : COLOR2);


class NGon {
  constructor(center, numSides, radius, color, angle) {
    this.center = center; // Point
    this.numSides = numSides; // int
    this.radius = radius; // float
    this.color = color; // String
    this.angle = angle; // float
  }

  toString() {
    return `radius=${this.radius}; angle=${this.angle}`;
  }

  draw(fill) {
    if (this.numSides < SIDES_MAX) {
      // rotate "1" (the starting point) appropriately
      let x0 = this.radius * Math.cos(this.angle) + this.center.x;
      let y0 = this.radius * Math.sin(this.angle) + this.center.y;

      canvasUtil.ctx.beginPath();
      if (fill) {
        canvasUtil.ctx.fillStyle = this.color;
      } else {
        canvasUtil.ctx.strokeStyle = 'black';
      }
      canvasUtil.ctx.moveTo(x0, y0);

      // connect the Nth roots of unity, properly rotated, scaled, and translated
      for (let k=0; k<this.numSides; k++) {
        let x = this.center.x + this.radius * Math.cos(k * 2 * Math.PI / this.numSides + this.angle);
        let y = this.center.y + this.radius * Math.sin(k * 2 * Math.PI / this.numSides + this.angle);
        canvasUtil.ctx.lineTo(x, y);
      }

      canvasUtil.ctx.lineTo(x0, y0);
      if (fill) {
        canvasUtil.ctx.fill();
      } else {
        canvasUtil.ctx.stroke();
      }
    } else {
      if (filling) {
        canvasUtil.drawDisk(this.center.x, this.center.y, this.radius, this.color);
      } else {
        canvasUtil.drawCircle(this.center.x, this.center.y, this.radius, 'black', 1);
      }
    }
  }
}

function updateNumSides(n) {
  numSides = parseInt(n);
  // console.log(`numSides = ${numSides}`);
}


function updateOffset(theta) {
  offset = Math.min(theta, offset_max());
  // console.log(`numShapes=${numShapesX()}`);
  initializeNGonsX();
}

function numShapesX() {
  // how many shapes are needed to cover the canvas (say, to have radius > 2 * WIDTH), given current offset and MIN_RADIUS?
  // i.e., for what n do we have MIN_RADIUS * scaleFactor()**n > 2 * WIDTH?
  let n = 1;
  let r = MIN_RADIUS * scaleFactor();
  while (r < 2 * WIDTH) {
    n++;
    r *= scaleFactor();
  }
  return Math.min(n, MAX_NUM_SHAPES);
}

function pauseDrawing() {
  paused = !paused;
  // console.log(`paused = ${paused}`);
}

function toggleFilling() {
  filling = !filling;
  // console.log(`filling = ${filling}`);
}

function toggleAngleMode() {
  constAngle = !constAngle;
  // console.log(`constAngle = ${constAngle}`);
}

function linesIntersect(a, b, c, d, p, q, r, s) {
  // returns true iff the line (a,b)->(c,d) intersects the line (p,q)->(r,s)
  let det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  }
  else {
    let lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    let gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
}


function scaleFactor() {
  /*
  By what amount must we scale a rotated version of a polygon so that it does not intersect the un-rotated one?
  Let n be the number of sides, and r the radius (distance from origin O to any vertex).
  Let ∆OAB be one sector of the original polygon. Let theta be the angle of rotation (assumed posiive and less than
  the angle of the segment, which is omega=2π/n). Let ∆OA'B' be the rotated sector. Note that segment AB and A'B' will intersect.
  Let ∆OA''B'' be the scaled version of ∆OA'B', scaled so that B lies on A''B''.
  Consider ∆OA''B, whose side length |OA''| is the new radius, and whose side length |OB| is the old radius.
  Let phi be the angle OAB, which is (π - omega)/2 = π(n-2)/(2n). This is also the angle OA''B
  Let psi be the angle OBA'', which is π - phi - theta.
  We know all the angles of ∆OA''B, and one side length (|OB|). The side length |OA''| can be obtained by the law of sines:
  |OA''|/sin(psi) = |OB|/sin(phi)
  => |OA''| = r sin(psi) / sin(phi)
  Hence the new radius is equal to the old one, multiplied by a scale factor of sin(psi) / sin(phi).
  */
  let phi = Math.PI * (numSides - 2) / (2 * numSides);
  let psi = Math.PI - phi - offset;
  return Math.sin(psi) / Math.sin(phi);
}

function draw() {
  if (paused) {
    return 0;
  }

  canvasUtil.clearCanvas();

  // update numSides, rotate, increment radii mod WIDTH, and then sort by radii before drawing
  for (let i=0; i<shapes.length; i++) {
    shapes[i].numSides = numSides;

    // angle
    if (constAngle) {
      shapes[i].angle = 0; //shapes[i].angle; // <- just "pause" the rotation
    } else {
      if (i == 0) {
        shapes[0].angle = (shapes[0].angle + ANGLE_INCREMENT) % (2 * Math.PI);
      } else {
        shapes[i].angle = (shapes[i-1].angle + offset + ANGLE_INCREMENT) % (2 * Math.PI);
      }
    }

    // radius
    if (i == 0) {
      shapes[0].radius += RADIUS_INCREMENT;
    } else {
      shapes[i].radius = shapes[i-1].radius * scaleFactor();
    }
  }

  // when a polygon gets too big, reset the radius and move it to the front of the array
  if (shapes[shapes.length-1].radius > maxRadius()) {
    shapes[shapes.length-1].radius = shapes[0].radius / scaleFactor();
    shapes[shapes.length-1].angle = shapes[0].angle - offset;
    shapes = [shapes[shapes.length-1]].concat(shapes.slice(0, shapes.length - 1));
  }

  // draw in reverse order so the largest polygon does not obscure all others
  for (let i=shapes.length-1; i>=0; i--) {
    shapes[i].draw(filling);
  }
}

function maxRadius() {
  return 2 * Math.max(WIDTH, HEIGHT);
}

function initializeNGonsX() {
  if (shapes.length > 0) {
    shapes = [shapes[0]];
  } else {
    shapes = [new NGon(
      new Point(WIDTH / 2, HEIGHT / 2),
      numSides,
      MIN_RADIUS,
      COLORS[0],
      0
    )];
  }
  for (i=1; i<numShapesX(); i++) {
    let angle = 0;
    let rad = MIN_RADIUS;
    if (i > 0) {
      rad = shapes[i-1].radius * scaleFactor();
      angle = shapes[i-1].angle + offset;
    }
    shapes.push(new NGon(
      new Point(WIDTH / 2, HEIGHT / 2),
      numSides,
      rad,
      COLORS[i],
      angle
    ));
  }
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    if (WIDTH <= 750) {
      HEIGHT = WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.5 * document.getElementById("controls").clientHeight);
    }
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    canvasUtil.clearCanvas();
    initializeNGonsX();
    return setInterval(draw, 50);
  } else {
    alert('You need a better web browser to see this.');
  }
}
