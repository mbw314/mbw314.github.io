let ctx;
let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;

function draw() {
  let r = Math.floor(255 * radSl.getValue() / radSl.getMaximum());
  let g = Math.floor(255 * (sepSl.getMaximum() - sepSl.getValue()) / sepSl.getMaximum());
  let b = Math.floor(255 * (phaseSl.getMaximum() - phaseSl.getValue()) / phaseSl.getMaximum());
  canvasUtil.clearCanvas(Color.colorString(r, g, b));

  let rad = radSl.getValue();
  let sep = sepSl.getValue();
  let numSides = sidesSl.getValue();
  let phi = phaseSl.getValue() * Math.PI / (numSides * 180);

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

  ctx.beginPath();
  ctx.moveTo(x0, y0);

  // connect the Nth roots of unity, properly rotated, scaled, and translated
  for (let k=0; k<numSides; k++) {
    let x = centerX + rad * Math.cos(k * 2 * Math.PI / numSides + phi);
    let y = centerY + rad * Math.sin(k * 2 * Math.PI / numSides + phi);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(x0, y0);
  ctx.stroke();
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(1.2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT);
    draw();
  }
}
