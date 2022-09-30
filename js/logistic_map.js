let canvasUtil;
let WIDTH = 750;
let HEIGHT = 500;
let bp; // BifurcationPlot object

let X_0 = 0.7;
let X_MIN = 0.0;  //-2.25;
let X_MAX = 4.25;
let Y_MIN = -0.25;
let Y_MAX = 1.25;
const ZOOM_FACTOR = 1.5;
const BG_COLOR = "white";
const CURVE_COLOR = "black";
let zoomExp = -1; // -1 for zoom in, +1 for zoom out


function quadraticRecurrence(x, r) {
  return r * x * (1 - x);
};
  
function roundTo(x, scale) {
  return Math.round(x * scale) / scale;
};


function recurrenceLimits(rec, r, x0) {
  // precompute the "head" of the sequence -- we just need the last value
  let nHead = 50000;
  let xN = x0;
  for (let i=0; i<nHead; i++) {
    xN = rec(xN, r);
  }

  // now compute the "tail" of the sequence -- we need all of the values
  let nTail = 500;
  let xs = Array(nTail).fill(xN);
  for (let i=1; i<nTail; i++) {
    xs[i] = rec(xs[i - 1], r);
  }  

  // round the values in the tail and take distinct values
  let limits = new Set(xs.map(x => x.toFixed(15)));
  return [...limits].map(x => parseFloat(x));
};


class BifurcationPlot {
  constructor({
      xMin = X_MIN,
      xMax = X_MAX,
      yMin = Y_MIN,
      yMax = Y_MAX,
      canvasWidth = WIDTH,
      canvasHeight = HEIGHT,
      scaleFactor = ZOOM_FACTOR
    }) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.scaleFactor = scaleFactor;
  }

  toString() {
    return `[${this.xMin.toFixed(5)}, ${this.xMax.toFixed(5)}] x [${this.yMin.toFixed(5)}, ${this.yMax.toFixed(5)}]`
  }


  draw2(ctx) {
    // TODO: this is somewhat faster, but more cumbersome to set the background color
    let imageData = canvasUtil.ctx.createImageData(this.canvasWidth, this.canvasHeight);
    let t0 = (new Date()).getTime();    
    let xScale = (this.xMax - this.xMin) / this.canvasWidth;    

    for (let pixelX = 0; pixelX < this.canvasWidth; pixelX++) {
      let r = this.xMin + pixelX * xScale;
      let ys = recurrenceLimits(quadraticRecurrence, r, X_0);
      ys.forEach(y => {
        if (this.yMin <= y && y <= this.yMax) {
          let pixelY = Math.round(this.canvasHeight * (this.yMax - y) / (this.yMax - this.yMin));
          let pixelIndex = (pixelY * this.canvasWidth + pixelX) * 4;
            let color = new Color(0, 0, 0) ;
            imageData.data[pixelIndex] = color.r;
            imageData.data[pixelIndex+1] = color.g;
            imageData.data[pixelIndex+2] = color.b;
            imageData.data[pixelIndex+3] = 255;   // Alpha
          };
      });
    };

    canvasUtil.ctx.putImageData(imageData, 0, 0);
    let t1 = (new Date()).getTime();
    canvasUtil.clearText();
    canvasUtil.println(this.toString());
    canvasUtil.println(`Drawing completed in ${t1 - t0} milliseconds.`);
  };

  draw(ctx) {
    let t0 = (new Date()).getTime();
    canvasUtil.ctx.globalAlpha = 1.0;
    canvasUtil.clearCanvas(BG_COLOR);
    canvasUtil.ctx.fillStyle = CURVE_COLOR;
    canvasUtil.ctx.globalAlpha = 0.15;

    let xScale = (this.xMax - this.xMin) / this.canvasWidth;
    let yScale = (this.yMax - this.yMin) / this.canvasHeight;

    range2(0, this.canvasWidth, 0.25).forEach(pixelX => {    
      let r = this.xMin + pixelX * xScale;
      let ys = recurrenceLimits(quadraticRecurrence, r, X_0);
      ys.forEach(y => {        
        // TODO: is it possible that this filtering can degrade the image?
        // if (this.yMin <= y && y <= this.yMax) {
          // let pixelY = (ms.canvasHeight - (this.yMax - y) / yScale);
          let pixelY = bp.canvasHeight - (y - this.yMin) / yScale;
          canvasUtil.ctx.fillRect(pixelX, pixelY, 1, 1);
        // };
      });
    });

    let t1 = (new Date()).getTime();
    canvasUtil.clearText();
    canvasUtil.println(this.toString());
    canvasUtil.println(`Drawing completed in ${t1 - t0} milliseconds.`);
  };


}


function range2(start, stop, step) {
  return Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)
}


function zoom(x0, y0) {
  let inOrOut = (zoomExp == -1) ? 'in' : 'out';
  
  let xScale = (bp.xMax - bp.xMin) / bp.canvasWidth;
  let yScale = (bp.yMax - bp.yMin) / bp.canvasHeight;

  let x = bp.xMin + x0 * xScale;
  let y = bp.yMax - y0 * yScale;

  let new_half_width = 0.5 * (bp.xMax - bp.xMin) * Math.pow(bp.scaleFactor, zoomExp);
  let new_half_height = 0.5 * (bp.yMax - bp.yMin) * Math.pow(bp.scaleFactor, zoomExp);
  
  bp.xMin = x - new_half_width;
  bp.xMax = x + new_half_width;
  bp.yMin = y - new_half_height;
  bp.yMax = y + new_half_height;
  
  let newX = 0.5 * (bp.xMax + bp.xMin);
  let newY = 0.5 * (bp.yMax + bp.yMin)
  let newPixelX = bp.canvasWidth * (newX - bp.xMin) / (bp.xMax - bp.xMin);
  let newPixelY = bp.canvasHeight * (bp.yMax - newY) / (bp.yMax - bp.yMin);

  bp.draw();
  zoomExp = -1;
}

function resetState() {
  canvasUtil.clearCanvas(BG_COLOR);
  bp = new BifurcationPlot({});
  bp.draw();
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    console.log(WIDTH);
    console.log(HEIGHT);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.mozImageSmoothingEnabled = true;
    ctx.webkitImageSmoothingEnabled = true;
    ctx.msImageSmoothingEnabled = true;
    // ctx.globalAlpha = 0.05;
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);    

    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect()
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        zoom(x, y);
      }
    );

    document.addEventListener('keydown', function(e) {
        if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
          zoomExp = 1;
        }
      }
    );

    resetState();
  }
  else { alert('You need a better web browser to see this.'); }
}
