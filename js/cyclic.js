let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
const NUM_POINTS = 512;
let t = 0;
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(255, 255, 255);
const GREEN = new Color(0, 255, 0);

function pauseDrawing() {
  paused = !paused;
}


function draw() {
  if (paused) {
    return 0;
  }

  // nice pictures version, animated, lower time interval
  t = (t + 0.00005) % NUM_POINTS;
  let t1 = t * (NUM_POINTS - t);
  let f = i => (t1 * i) % NUM_POINTS; // linear in i, change slope with time, mix of patterns and chaos
  //let f = i => (50 * t1 + 17 * i) % NUM_POINTS; // linear in i, change the interept with time, very uniform with small slope, complex with large slope
  //let f = i => (25 * t1 + i * i) % NUM_POINTS; // quadratic in i, somewhat chaotic
  //console.log(`map: i -> ${parseInt(t1)} * i`);

  // true automorphisms version, higher time interval
  // t = (t + 1) % NUM_POINTS;
  // let f = i => (t * i) % NUM_POINTS; // linear in i, change slope with time, mix of patterns and chaos
  // console.log(`map: i -> ${t} * i`);

  canvasUtil.clearCanvas();
  createImage(f);
  canvasUtil.clearText();
  canvasUtil.println(`Endomorphism parameter c = ${parseInt(t1)}`);
}


function createImage(f) {
  // draw main circle
  let cx = WIDTH / 2;
  let cy = HEIGHT / 2;
  let rad = 0.45 * Math.min(WIDTH, HEIGHT);
  canvasUtil.drawCircle(cx, cy, rad, 'black', 1);

  // draw N points (roots of unity) on the circle
  // draw line segments from p_i to f(p_i)
  for (let i=0; i<NUM_POINTS; i++) {
    let theta0 = 2 * Math.PI * i / NUM_POINTS;
    let x0 = rad * Math.cos(theta0) + cx;
    let y0 = rad * Math.sin(theta0) + cy;

    let theta1 = 2 * Math.PI * f(i) / NUM_POINTS;
    let x1 = rad * Math.cos(theta1) + cx;
    let y1 = rad * Math.sin(theta1) + cy;

    canvasUtil.drawLine(x0, y0, x1, y1, Color.colorString(140, 140, 140), 1);
    canvasUtil.drawDisk(x0, y0, 2, 'black');
  }
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas();
    return setInterval(draw, 5);
  } else {
    alert('You need a better web browser to see this.');
  }
}
