let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;

const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

RAD_MIN = 25;
RAD_MAX = 300;
RAD_DEFAULT = 175;

SEP_MIN = 20;
SEP_MAX = 400;
SEP_DEFAULT = 100;

SIDES_MIN = 3;
SIDES_MAX = 10;
SIDES_DEFAULT = 4;

PHASE_MIN = 0;
PHASE_MAX = 360;
PHASE_DEFAULT = 60;

function draw(rad, sep, numSides, phase) {
  let r = Math.floor(255 * rad / RAD_MAX);
  let g = Math.floor(255 * (SEP_MAX - sep) / SEP_MAX);
  let b = Math.floor(255 * (PHASE_MAX - phase) / PHASE_MAX);
  canvasUtil.clearCanvas(Color.colorString(r, g, b));

  let phi = phase * Math.PI / (numSides * 180);

  for (let i = 0 - sep - rad; i <= WIDTH + rad + sep; i = i + sep) {
    for (let j = 0 - sep - rad; j <= HEIGHT + rad + sep; j = j + sep) {
      if (numSides == 10) {
        canvasUtil.drawCircle(i, j, rad, 'black', 1);
      } else {
        drawNGon(numSides, i, j, rad, phi);
      }
    }
  }
}

function drawNGon(numSides, centerX, centerY, rad, phi) {
  //console.log(`drawNGon with n=${n}; x=${x}; y=${y}; rad=${rad}; phi=${phi}`);
  // rotate "1" (the starting point) appropriately
  let x0 = rad * Math.cos(phi) + centerX;
  let y0 = rad * Math.sin(phi) + centerY;

  canvasUtil.ctx.beginPath();
  canvasUtil.ctx.moveTo(x0, y0);

  // connect the Nth roots of unity, properly rotated, scaled, and translated
  for (let k=0; k<numSides; k++) {
    let x = centerX + rad * Math.cos(k * 2 * Math.PI / numSides + phi);
    let y = centerY + rad * Math.sin(k * 2 * Math.PI / numSides + phi);
    canvasUtil.ctx.lineTo(x, y);
  }

  canvasUtil.ctx.lineTo(x0, y0);
  canvasUtil.ctx.stroke();
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    console.log(WIDTH);
    if (WIDTH <= 750) {
      HEIGHT = WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.5 * document.getElementById("controls").clientHeight);
    }
    console.log(HEIGHT);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    let actualRad = sliderToActual(SLIDER_MIN, SLIDER_MAX, RAD_MIN, RAD_MAX, RAD_DEFAULT);
  	let actualSep = sliderToActual(SLIDER_MIN, SLIDER_MAX, SEP_MIN, SEP_MAX, SEP_DEFAULT);
  	let actualSides = sliderToActual(SLIDER_MIN, SLIDER_MAX, SIDES_MIN, SIDES_MAX, SIDES_DEFAULT);
  	let actualPhase = sliderToActual(SLIDER_MIN, SLIDER_MAX, PHASE_MIN, PHASE_MAX, PHASE_DEFAULT);
    draw(actualRad, actualSep, actualSides, actualPhase);
  }
}
