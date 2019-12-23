
var canvas,ctx;
var WIDTH = 750;
var HEIGHT = 750;

var sep = 50;
var move = 0;
var turn = 1;
var canTurnLeft = 0;
var canGoAhead = 0;
var canTurnRight = 0;

var dots;
var x0,x1,x2,y0,y1,y2;
var dotRad = 4;
var tempRad = 3;

var dotsLeft = 0;

var type;  // either dot or line
var data1; // x for dot, x0 for line
var data2; // y for dot, y0 for line
var data3; // r for dot, x1 for line
var data4; // - for dot, y2 for line
var data5; // c for dot,  c for line

var count = 0;

function drawLine(x0,y0,x1,y1,c) {
ctx.beginPath();
ctx.strokeStyle = c;
ctx.moveTo(x0,y0);
ctx.lineTo(x1,y1);
ctx.closePath();
ctx.stroke();
}

function drawDot(x,y,r,c) {
ctx.beginPath();
ctx.fillStyle = c;
ctx.arc(x,y,r,0,2*Math.PI,true);
ctx.closePath();
ctx.fill();
}

function addLine(x0,y0,x1,y1,c) {
type.length++;
data1.length++;
data2.length++;
data3.length++;
data4.length++;
data5.length++;

type[type.length-1] = "line";
data1[data1.length-1] = x0;
data2[data2.length-1] = y0;
data3[data3.length-1] = x1;
data4[data4.length-1] = y1;
data5[data5.length-1] = c;
}

function addDot(x,y,r,c) {

if( type[type.length-1] == "dot" &&
  data1[data1.length-1] == x &&
  data2[data2.length-1] == y &&
  data3[data3.length-1] == r &&
  data5[data5.length-1] == c) {
}
else {

  type.length++;
  data1.length++;
  data2.length++;
  data3.length++;
  data4.length++;
  data5.length++;

  type[type.length-1] = "dot";
  data1[data1.length-1] = x;
  data2[data2.length-1] = y;
  data3[data3.length-1] = r;
  data4[data4.length-1] = 0;
  data5[data5.length-1] = c;
}
}




function draw() {

if (count < type.length) {
  if (type[count] == "dot")
    drawDot(data1[count],data2[count],data3[count],data5[count]);
  else
    drawLine(data1[count],data2[count],data3[count],data4[count],data5[count]);

  count++;
}
}



function firstPoints() {

// draw a line from a random point
x0 = Math.round(Math.random()*(WIDTH/sep));
y0 = Math.round(Math.random()*(HEIGHT/sep));

// check to make sure it's ok to draw the first point
if ( 0 < x0 && x0 < Math.round(WIDTH/sep) &&
       0 < y0 && y0 < Math.round(HEIGHT/sep) ) {  //inside the bounds

  if (dots[x0][y0] == 0) {	// spot is empty
    addDot(x0*sep,y0*sep,dotRad,"rgb(0,255,0)");
    dots[x0][y0] = 1;
    dotsLeft = dotsLeft - 1;

    // after first point is drawn, try to draw second...

    // pick a random direction, and change the direction if original doesn't work
    var dir = Math.round(Math.random()*4)%4;
    var pickNew = 0;
    var tries = 0;

    while (pickNew == 0 && tries < 4) {
      // compute the coordinate of the second point
      if (dir == 0) { // right
        x1 = x0 + 1;
        y1 = y0;
      }
      else if (dir == 1) { // up
        x1 = x0;
        y1 = y0 - 1;
      }
      else if (dir == 2) { // left
        x1 = x0 - 1;
        y1 = y0;
      }
      else if (dir == 3) { // down
        x1 = x0;
        y1 = y0 + 1;
      }
      // check to make sure it's ok to draw the second point
      if ( 0 < x1 && x1 < Math.round(WIDTH/sep) &&
        0 < y1 && y1 < Math.round(HEIGHT/sep) ) {

        if (dots[x1][y1] == 0) {

          // reset booleans
          move = 0;
          canTurnLeft = 0;
          canGoAhead = 0;
          canTurnRight = 0;

          addLine(x0*sep,y0*sep,x1*sep,y1*sep,"rgb(255,255,255)");
          addDot(x1*sep,y1*sep,dotRad,"rgb(255,255,255)");
          dotsLeft = dotsLeft - 1;
          dots[x1][y1] = 1;

          pickNew = 1;
        }
        else {
          dir = (dir+1)%4;
          tries++;
        }
      }
      else {
        dir = (dir+1)%4;
        tries++;
      }
    }
  }
}
}

function moveToNext(d) {

if (d == 0) { //turning left
  // get displacement vector from previous point
  var delta_x = x1-x0;
  var delta_y = y1-y0;

  // rotate 3*PI/2, and shift to start at (x1,y1)
  x2 = Math.round(delta_y  + x1);
  y2 = Math.round(-1*delta_x + y1);
}
else if (d == 1) { //go ahead
  // get displacement from previous point
  x2 = Math.round(x1 + (x1-x0));
  y2 = Math.round(y1 + (y1-y0));
}
else if (d == 2) { //turning right
  // get displacement vector from previous point
  var delta_x = x1-x0;
  var delta_y = y1-y0;

  // rotate PI/2, and shift to start at (x1,y1)
  x2 = Math.round(-1*delta_y + x1);
  y2 = Math.round(delta_x  + y1);
}

// check to make sure it's ok to draw it
if ( 0 < x2 && x2 < Math.round(WIDTH/sep) &&
       0 < y2 && y2 < Math.round(HEIGHT/sep) ) {

  if (dots[x2][y2] == 0) {

    addDot(x2*sep,y2*sep,dotRad,"rgb(255,255,255)");
    dotsLeft = dotsLeft - 1;
    dots[x2][y2] = 1;
    addLine(x1*sep,y1*sep,x2*sep,y2*sep,"rgb(255,255,255)");

    x0 = x1;
    y0 = y1;
    x1 = x2;
    y1 = y2;

    canTurnLeft = 0;
    canGoAhead = 0;
    canTurnRight = 0;
  }
  else {
    //document.outform.output.value += '\n' + 'already filled';
    if (d == 0)  //turning left
      canTurnLeft = 1;
    else if (d == 1)  //go ahead
      canGoAhead = 1;
    else if (d == 2)  //turning right
      canTurnRight = 1;
  }
}
else {
  //document.outform.output.value += '\n' + 'out of bounds';
  if (d == 0)  //turning left
    canTurnLeft = 1;
  else if (d == 1)  //go ahead
    canGoAhead = 1;
  else if (d == 2)  //turning right
    canTurnRight = 1;
}
}


function init(){

// get the canvas element using the DOM
canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Make sure we don't execute when canvas isn't supported
if (canvas.getContext){
  // use getContext to use the canvas for drawing
  ctx = canvas.getContext('2d');
  sep = document.getElementById("spacing").value;

  // fill the array to keep track of which dots were drawn
  dots = new Array(Math.round(WIDTH/sep));
  for (var i=0; i<dots.length; i++) {
    dots[i] = new Array(Math.round(HEIGHT/sep));
  }
  for (var i=0; i<dots.length; i++) {
    for (var j=0; j<dots[i].length; j++) {
      dots[i][j] = 0;
      if (j > 0 && i > 0) drawDot(i*sep,j*sep,tempRad,"rgb(0,0,0)");
    }
  }

  count = 1;

  // initialize data arrays
  type  = new Array(1);
  data1 = new Array(1);
  data2 = new Array(1);
  data3 = new Array(1);
  data4 = new Array(1);
  data5 = new Array(1);

  // draw reference dots
  for (var i=1; i<Math.round(WIDTH/sep); i++) {
    for( var j=1; j<Math.round(HEIGHT/sep); j++) {
      drawDot(i*sep,j*sep,tempRad,'rgb(0,0,0)');
    }
  }

  dotsLeft = (Math.round(WIDTH/sep)-1)*(Math.round(HEIGHT/sep)-1);

  // figure everything out!
  while (dotsLeft > 0) { // keep drawing stuff

    firstPoints();

    while (move == 0) {

      var turn = Math.round(Math.random()*2);  // random interger 0 (Left), 1 (ahead), 2 (right) for the direction to turn

      moveToNext(turn);

      if (canTurnLeft == 1 && canGoAhead == 1 && canTurnRight == 1) {
        move = 1;
      }
    }

    // "end dot"
    if ( 0 < x1 && x1 < Math.round(WIDTH/sep) &&
      0 < y1 && y1 < Math.round(HEIGHT/sep) ) {
      addDot(x1*sep,y1*sep,dotRad,"rgb(255,0,0)");
    }
  }

  // call the drawing function
  return setInterval(draw, 25);
}
else { alert('You need a better web browser to see this.'); }
}	
