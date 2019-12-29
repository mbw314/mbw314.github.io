
var iter = 0;
var scheme = 0;
var x0 = 375;
var y0 = 375;
var r0 = 375;
var theta = Math.PI;
var c = new Array(3) //an array of three integers (mod 256) to represent a color
var ctx;

var c0;
var c1;
var c2;


function setColors(j, step) {
	if (scheme == 0) {
		c[0] = Math.floor(Math.random() * 256);
		c[1] = Math.floor(Math.random() * 256);
		c[2] = Math.floor(Math.random() * 256);
	}
	else if (scheme == 1) {
		if(step < Math.pow(2, j-1)) { // gets darker
			c[0] = Math.floor(c0 * (1 - Math.sin((j/iter) * (Math.PI/2))));
			c[1] = Math.floor(c1 * (1 - Math.sin((j/iter) * (Math.PI/2))));
			c[2] = Math.floor(c2 * (1 - Math.sin((j/iter) * (Math.PI/2))));
    } else { // gets lighter
    	c[0] = Math.floor(c0 * Math.sin((j/iter) * (Math.PI/2)));
    	c[1] = Math.floor(c1 * Math.sin((j/iter) * (Math.PI/2)));
    	c[2] = Math.floor(c2 * Math.sin((j/iter) * (Math.PI/2)));
    }
	}
}


function drawShape(){

	// get the canvas element using the DOM
	var canvas = document.getElementById("canvas");

	// Make sure we don't execute when canvas isn't supported
	if (canvas.getContext){

		// use getContext to use the canvas for drawing
		ctx = canvas.getContext('2d');

		iter = document.getElementById("iter").value;
		scheme = document.getElementById("color").value;

		c0 = Math.floor(Math.random() * 156) + 100;
		c1 = Math.floor(Math.random() * 156) + 100;
		c2 = Math.floor(Math.random() * 156) + 100;

		// iteration 0
		// lower half
		ctx.fillStyle = 'rgb(' + c0 + ',' + c1 + ',' + c2 + ')';
		ctx.beginPath();
		ctx.arc(x0, y0, r0, 0, theta, clockwise);
		ctx.closePath();
		ctx.fill();
		// upper half
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.beginPath();
		ctx.arc(x0, y0, r0, 0, theta, !clockwise);
		ctx.closePath();
		ctx.fill();

		for(n=1; n<=iter; n++){
			for(i=0; i<Math.pow(2,n); i++){ //there are 2^n semicircles drawn at each iteration
				var x = x0-r0 + r0/Math.pow(2,n) + i*r0/Math.pow(2,n-1);
				var r = r0/Math.pow(2,n);
				var clockwise = i%2==1 ? false : true; // clockwise or anticlockwise  //alternate up and down

				if(iter == 1 && scheme ==1) {  //unfortunatley have to handle this case separately
					ctx.fillStyle = 'rgb(' + Math.floor(c0/2) + ',' + Math.floor(c1/2) + ',' + Math.floor(c2/2) + ')';
				}
				else {
					setColors(n,i,scheme);
					ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
				}

				ctx.beginPath();
				ctx.arc(x, y0, r, 0, theta, clockwise);
				ctx.closePath();
				ctx.fill();
			}
		}
	}
	else {
		alert('You need a better web browser to see this.');
	}
}
