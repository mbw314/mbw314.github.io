class Color {
	constructor(red, green, blue) {
		this.r = red;
		this.g = green;
		this.b = blue;
	}

  static interpolate(c0, c1, t) {
		//println('iterpolating colors');
		// t * c1 + (1 - t) * c0
		let r = (t * c1.r + (1.0 - t) * c0.r) % 256;
		let g = (t * c1.g + (1.0 - t) * c0.g) % 256;
		let b = (t * c1.b + (1.0 - t) * c0.b) % 256;
		return new Color(r, g, b);
	}

	static get_color_lookup(c0, c1, n) {
    let lookup = [];
		for (let i = 0; i < n; i++) {
      let c = Color.interpolate(c0, c1, i / (n - 1));
			lookup.push(c.toString());
		}
		lookup.push('rgb(0, 0, 0)');
		return lookup;
	}

	toString() {
		return `rgb(${this.r.toFixed(3)}, ${this.g.toFixed(3)}, ${this.b.toFixed(3)})`;
	}
}

const X_MIN = -2.0;
const X_MAX = 1.0;
const Y_MIN = -1.5
const Y_MAX = 1.5;
const RADIUS = 2.0;
const MAX_ITERATIONS = 105;
const SCALE_FACTOR = 1.5;
const COLOR0 = new Color(0, 0, 255);
const COLOR1 = new Color(0, 255, 0);


class MandelbrotSet {
  constructor({
      x_min = X_MIN,
      x_max = X_MAX,
      y_min = Y_MIN,
      y_max = Y_MAX,
      canvas_width,
      canvas_height,
      radius = RADIUS,
      max_iterations = MAX_ITERATIONS,
			scale_factor = SCALE_FACTOR,
			color0 = COLOR0,
			color1 = COLOR1
    }) {
    this.x_min = x_min;
    this.x_max = x_max;
    this.y_min = y_min;
    this.y_max = y_max;
    this.canvas_width = canvas_width;
    this.canvas_height = canvas_height;
    this.radius = radius;
    this.max_iterations = max_iterations;
		this.scale_factor = scale_factor;
		this.color0 = color0;
		this.color1 = color1;
		this.color_lookup = Color.get_color_lookup(color0, color1, max_iterations);
		this.color_lookup.forEach(c => println(c.toString()));
  }

  toString() {
		return `[${this.x_min.toFixed(5)}, ${this.x_max.toFixed(5)}] x [${this.y_min.toFixed(5)}, ${this.y_max.toFixed(5)}]`
	}

  f(x, y, c_x, c_y) {
    return [x * x - y * y + c_x, 2 * x * y + c_y];
  }

  draw(ctx) {
		println(this.toString());
		let time0 = (new Date()).getTime();
		let radius_sq = this.radius * this.radius;
		let x_scale = (this.x_max - this.x_min) / this.canvas_width;
		let y_scale = (this.y_max - this.y_min) / this.canvas_height;
    for (let x = 0; x < this.canvas_width; x++) {
      for (let y = 0; y < this.canvas_height; y++) {
        var c_x = this.x_min + x * x_scale;
        var c_y = this.y_min + y * y_scale;
        var z_x = 0.0;
        var z_y = 0.0;
        let iteration = 0;

				// this wikipedia optimzation is slower in chrome, faster in firefox
				// let rsquare = 0;
        // let isquare = 0;
        // let zsquare = 0;
				// while (iteration < this.max_iterations && rsquare + isquare < radius_sq) {
				// 	z_x = rsquare - isquare + c_x
			  //   z_y = zsquare - rsquare - isquare + c_y
			  //   rsquare = z_x * z_x
			  //   isquare = z_y * z_y
			  //   zsquare = (z_x + z_y) * (z_x + z_y)
				// 	iteration += 1;
				// }

        while (iteration < this.max_iterations && z_x * z_x + z_y * z_y < radius_sq) {
          [z_x, z_y] = this.f(z_x, z_y, c_x, c_y);
          iteration += 1;
        }

				fillPixel(x, y, this.color_lookup[iteration]);
        // if ((x + y) % 500 == 0) {
				// 	println(`x=${x.toFixed(5)}; y=${y.toFixed(5)}; z_x=${z_x.toFixed(5)}; z_y=${z_y.toFixed(5)}; iter=${iteration}; intensity=${intensity.toFixed(5)}; color=${c.toString()}`);
  			//   //println(intensity.toString());
				// }
      }
    }
		let time1 = (new Date()).getTime();
		var delta_t = time1 - time0;
		println("Drawing completed in " + delta_t + " milliseconds.");
  }
}


var canvas;
var ctx;
var WIDTH = 750;
var HEIGHT = 750;
var ms;

function println(msg) {
  document.outform.output.value += msg + '\n';
  console.log(msg);
}

function clear_text() {
  document.outform.output.value = "";
}

function fillPixel(x, y, c) {
	ctx.fillStyle = c; //.toString();
	ctx.fillRect(x, y, 1, 1);
}

function clear_canvas() {
	ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
	ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.closePath();
	ctx.fill();
}

function zoom(x0, y0) {
	println(`zooming in around pixel (${x0}, ${y0})`);

	let x_scale = (ms.x_max - ms.x_min) / ms.canvas_width;
	let y_scale = (ms.y_max - ms.y_min) / ms.canvas_height;

	let x = ms.x_min + x0 * x_scale;
	let y = ms.y_min + y0 * y_scale;

	//println(` this correspons to plane point (${x.toFixed(5)}, ${y})`)

  let new_half_width = 0.5 * (ms.x_max - ms.x_min) / ms.scale_factor;
	let new_half_height = 0.5 * (ms.y_max - ms.y_min) / ms.scale_factor;

	ms.x_min = x - new_half_width;
	ms.x_max = x + new_half_width;
	ms.y_min = y - new_half_height;
	ms.y_max = y + new_half_height;
	//println(ms.toString());
	ms.draw(ctx);
}


function reset_state() {
	ms = new MandelbrotSet({'canvas_width': canvas.width, 'canvas_height': canvas.height});
	ms.draw(ctx);
}

function init() {
	canvas = document.getElementById("canvas");
	canvas.width = WIDTH;
	canvas.height = WIDTH;

	// Make sure we don't execute when canvas isn't supported
	if (canvas.getContext){
		ctx = canvas.getContext('2d');
		canvas.addEventListener('click', function(e) {zoom(e.clientX, e.clientY);});
		clear_canvas();
    reset_state();
	}
	else { alert('You need a better web browser to see this.'); }
}

// TODO:
// enable zoom out with shift+click
// investigate drawing pixels: var imagedata = context.createImageData(width, height);
