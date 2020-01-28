let canvas;
let ctx;
let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let mouseX = 1;
let mouseY = 1;

let disks = [];
let numDisks = 200;

class Disk {
  constructor(center, radius, color) {
    this.center = center; // Point
    this.radius = radius; // function time -> radius
    this.color = color; // String
  }

  draw(t) {
    canvasUtil.drawDisk(
      this.center.x,
      this.center.y,
      this.radius(t),
      this.color);
  }

}

// function ev_mousemove(e) {
//   const rect = canvas.getBoundingClientRect()
//   mouseX = e.clientX - rect.left
//   mouseY = e.clientY - rect.top
// }


function pauseDrawing() {
  paused = !paused;
}


function draw() {
  if (paused) {
    return 0;
  }

  // main drawing code
  canvasUtil.clearCanvas();

  let time = new Date();
  let t = time.getMilliseconds();
  for (i=0; i<numDisks; i++) {
   disks[i].draw(t);
  }

  canvasUtil.clearText();
  //canvasUtil.println(`mouse: (${mouseX}, ${mouseY})`);
}


function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas();
    //canvas.addEventListener('mousemove', ev_mousemove, false);
    for (i=0; i<numDisks; i++) {
      disks.push(new Disk(new Point(WIDTH / 2, HEIGHT / 2), t => Math.max(0, t - 1000 * (i+1)/numDisks), Color.random().toString()))
    }

    return setInterval(draw, 50);
  } else {
    alert('You need a better web browser to see this.');
  }
}
