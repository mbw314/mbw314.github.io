let canvas;
let ctx;
let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let mouseX = 1;
let mouseY = 1;


function ev_mousemove(e) {
  const rect = canvas.getBoundingClientRect()
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top
}


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
  let t = time.getMilliseconds() / 10;
  canvasUtil.drawDisk(WIDTH / 2, HEIGHT / 2, t % 250 + 1, "black");

  canvasUtil.clearText();
  canvasUtil.println(`mouse: (${mouseX}, ${mouseY})`);
}


function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvas.addEventListener('mousemove', ev_mousemove, false);

    return setInterval(draw, 10);
  } else {
    alert('You need a better web browser to see this.');
  }
}
