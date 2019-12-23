
// variables
var n;		    		// number of colors
var width;		// width of image
var height;   	// height of image
var mag;			// magnification
var zoomed; 		// zoomed in or not
var centered; 	// centered or not (random)
var ref = 0;   // refreshing or not
var style = 0;
var time0 = 0;
var time1 = 0;
var firstrows = 1;

var rule = new Array(); // holds the rule
var storedLines = new Array(); // holds the first firstline lines, depending on the style
var curLine = new Array();  // holds the current line's colors
var colorList = new Array(); //holds all the colors that are to be used
var canvas;
var ctx;



function drawPixel(i,j,c) {
	// don't draw the last line (which is overlap)
	if( j < (height/mag) ) {
		ctx.fillStyle = colorList[c];
		ctx.fillRect(mag*i,mag*j,mag,mag);
	}
}


function setRule(i) {
	// create the array for the rule, depending on which style we're drawing
	if( i == 0 ) { //typical 3 boxes in row above current box
		rule = new Array(Math.pow(n,3));
		//alert("setRule with i = " + i);
	}
	else if( i == 1 ) { // 2 boxes in row above current box
		rule = new Array(Math.pow(n,2));
		//alert("setRule with i = " + i);
	}
	else if( i == 2 ) { // 5 boxes in row above current box
		rule = new Array(Math.pow(n,5));
		//alert("setRule with i = " + i);
	}
    else if( i == 3 ) { // 4 boxes, three in row above, one two rows above
		rule = new Array(Math.pow(n,4));
	}
	else if( i == 4 ) { // 6 boxes, three in row above, three in row two above
		rule = new Array(Math.pow(n,6));
	}

	// fill the array randomly
	for(var k=0; k < rule.length; k++) {
		rule[k] = Math.round(Math.random()*n+1)%n;
	}
	//alert("made a rule array of length " + rule.length);

  // display the rule in the textbox
	document.outform.output.value = "Rule: ";
	for(var k=0; k < rule.length; k++) {
		document.outform.output.value += rule[k];
	}
}

function makeRows() { // make firstrows rows

	//alert("making first " + firstrows + " row(s)");

	// set up the double array to hold the first lines that are stored throughout the algorithm
	storedLines = new Array(width/mag);
	for(var i=0; i < storedLines.length; i++) {
		storedLines[i] = new Array(firstrows);
	}

	for(var i = 0; i < firstrows; i++) {  //for each of the rows in question...
		if( centered == 0 ) {  // centered rows
			for(var k=0; k < (width/mag); k++) {
				storedLines[k][i] = 0;
				drawPixel(k,i,0);
			}
			storedLines[Math.round((width/mag)/2)][i] = 1;
			drawPixel(Math.round((width/mag)/2),i,1);
		}
		else{ // random rows
			var temp = 0;
			for(var k=0; k < (width/mag); k++) {
				temp = Math.round(Math.random()*n+1)%n; //random integer between 0 and #colors-1
				for(var c = 0; c < n; c++) {
					if( temp == c ) {
						storedLines[k][i] = c;
						drawPixel(k,i,c);
					}
				}
			}
		}
	}
}

function drawAutomata(colors,sty,magn,fst,wth,hgt,scr,ref){

	//alert("drawAutomata called with colors = " + colors.value + ", sty = " + sty.value + ", mag = " + magn.value + ", first line = " + fst.value + ", width = " + wth.value + ", height = " + hgt.value + ", scrolling = " + scr + " , refresh = " + ref);

	var date0 = new Date();
	time0 = date0.getTime();

	// get the canvas element using the DOM
	canvas = document.getElementById("canvas");

	// Make sure we don't execute when canvas isn't supported
	if (canvas.getContext){

		// use getContext to use the canvas for drawing
		ctx = canvas.getContext('2d');

		// set the canvas size to the desired size
		canvas.width = wth.value;
		canvas.height = hgt.value;

		// if refreshing, leave n, the actual colors, the style, and the rule the same, update others
		if( ref != 0 ) {
			n = colors.value; //number of colors
			style = sty.value; //the style

			// set up (random) color list
			for(var k=0; k<n; k++) {
				colorList[k] = 'rgb(' + Math.floor(Math.random()*256) + ','
	                + Math.floor(Math.random()*256) + ','
	                + Math.floor(Math.random()*256) + ')';
			}

			// make the array for the rule, filled randomly, according to the right style
			setRule(style);
		}

		// variables
		mag = magn.value; //magnification level
		width = wth.value;
		height = hgt.value;
		centered = fst.value;  // first line centered/random

		// set up array
		curLine = new Array(width/mag);

		// how many first rows are being drawn?
		if( style == 0 || style == 1 || style == 2 ) {
			firstrows = 1;
		//alert("firstrows = " + firstrows);
		}
		else if( style == 3 || style == 4 ) {
			firstrows = 2;
		//alert("firstrows = " + firstrows);
		}

		// set up the first rows, depending on the style
		makeRows();

		//fill the rest

		// which style is it?
		if( style == 0 ) { //three boxes in row above
			//alert("first style/0");
			for(var j=firstrows; j <= (height/mag); j++) {  // j = rows
				for(var i=0; i < (width/mag); i++) { // i = columns
					// cycle through all the rules
					for(var k=0; k < n; k++) { // first box
						for(var l=0; l < n; l++) { // second box
							for(var m=0; m < n; m++) { // third box
								if( storedLines[(i-1+(width/mag))%(width/mag)][0] == k &&
																storedLines[i][0] == l &&
									storedLines[(i+1+(width/mag))%(width/mag)][0] == m ) {
									//which rule was it?  as filling a
									// cube: total levels + total rows + partial row
									curLine[i] = rule[n*n*k + n*l + m];
									drawPixel(i,j,rule[n*n*k + n*l + m]);
								}
							}
						}
					}
				}

				// move up the rows
				for(var t=0; t<firstrows-1; t++) {
					for(var s=0; s < width/mag; s++) {
						storedLines[s][t] = storedLines[s][t+1];
					}
				}
				for(var s=0; s < width/mag; s++) {
					storedLines[s][firstrows-1] = curLine[s];
				}
			}
		}
		else if( style == 1 ) { //two boxes above
			//alert("second style/1");
			for(var j=firstrows; j <= (height/mag); j++) {  // j = rows
				for(var i=0; i < (width/mag); i++) { // i = columns
					// cycle through all the rules
					for(var k=0; k < n; k++) { // first box
						for(var l=0; l < n; l++) { // second box
							if( storedLines[(i-1+(width/mag))%(width/mag)][0] == k &&
															storedLines[i][0] == l ) {
								//which rule was it?  as filling a square:
								// total rows + partial row
								curLine[i] = rule[n*k + l];
								drawPixel(i,j,rule[n*k + l]);
							}
						}
					}
				}

				// move up the rows
				for(var t=0; t<firstrows-1; t++) {
					for(var s=0; s < width/mag; s++) {
						storedLines[s][t] = storedLines[s][t+1];
					}
				}
				for(var s=0; s < width/mag; s++) {
					storedLines[s][firstrows-1] = curLine[s];
				}
			}
		}
		else if( style == 2 ) { //three boxes in row above
			//alert("third style/2");
			for(var j=firstrows; j <= (height/mag); j++) {  // j = rows
				for(var i=0; i < (width/mag); i++) { // i = columns
					// cycle through all the rules
					for(var k=0; k < n; k++) { // first box
						for(var l=0; l < n; l++) { // second box
							for(var m=0; m < n; m++) { // third box
								for(var p=0; p < n; p++) { // fourth box
									for(var q=0; q < n; q++) { // fifth box
										if( storedLines[(i-2+(width/mag))%(width/mag)][0] == k &&
											storedLines[(i-1+(width/mag))%(width/mag)][0] == l &&
																		storedLines[i][0] == m &&
											storedLines[(i+1+(width/mag))%(width/mag)][0] == p &&
											storedLines[(i+2+(width/mag))%(width/mag)][0] == q ) {
											//which rule was it?  as filling a
											// 5-d cube: total levels + total rows + partial row + etc...
											curLine[i] = rule[n*n*n*n*k + n*n*n*l + n*n*m + n*p + q];
											drawPixel(i,j,rule[n*n*n*n*k + n*n*n*l + n*n*m + n*p + q]);
										}
									}
								}
							}
						}
					}
				}

				// move up the rows
				for(var t=0; t<firstrows-1; t++) {
					for(var s=0; s < width/mag; s++) {
						storedLines[s][t] = storedLines[s][t+1];
					}
				}
				for(var s=0; s < width/mag; s++) {
					storedLines[s][firstrows-1] = curLine[s];
				}
			}
		}
		else if( style == 3 ) { //three boxes in row above, plus one box two rows above
			//alert("fourth style/3");
			for(var j=firstrows; j <= (height/mag); j++) {  // j = rows
				for(var i=0; i < (width/mag); i++) { // i = columns
					// cycle through all the rules
					for(var k=0; k < n; k++) { // first box
						for(var l=0; l < n; l++) { // second box
							for(var m=0; m < n; m++) { // third box
								for(var p=0; p < n; p++) { // fourth box
									if( storedLines[(i-1+(width/mag))%(width/mag)][1] == k &&
																	storedLines[i][1] == l &&
										storedLines[(i+1+(width/mag))%(width/mag)][1] == m &&
																	storedLines[i][0] == p ) {                                     	          	                  	         								  //which rule was it?  as filling a
										// 4d-cube: total levels + total rows + partial row
										curLine[i] = rule[n*n*n*k + n*n*l + n*m + p];
										drawPixel(i,j,rule[n*n*n*k + n*n*l + n*m + p]);
									}
								}
							}
						}
					}
				}

				// move up the rows
				for(var t=0; t<firstrows-1; t++) {
					for(var s=0; s < width/mag; s++) {
						storedLines[s][t] = storedLines[s][t+1];
					}
				}
				for(var s=0; s < width/mag; s++) {
					storedLines[s][firstrows-1] = curLine[s];
				}
			}
		}
		else if( style == 4 ) { //three boxes in row above, plus one box two rows above
			//alert("fourth style/4");
			for(var j=firstrows; j <= (height/mag); j++) {  // j = rows
				for(var i=0; i < (width/mag); i++) { // i = columns
					// cycle through all the rules
					for(var k=0; k < n; k++) { // first box
						for(var l=0; l < n; l++) { // second box
							for(var m=0; m < n; m++) { // third box
								for(var p=0; p < n; p++) { // fourth box
									for(var q=0; q < n; q++) { // fifth box
										for(var r=0; r < n; r++) { // sixth box
											if( storedLines[(i-1+(width/mag))%(width/mag)][1] == k &&
																			storedLines[i][1] == l &&
												storedLines[(i+1+(width/mag))%(width/mag)][1] == m &&
												storedLines[(i-1+(width/mag))%(width/mag)][0] == p &&
																			storedLines[i][0] == q &&
												storedLines[(i+1+(width/mag))%(width/mag)][0] == r ) {                                     	          	                  	         								  //which rule was it?  as filling a
												// 6d-cube: total levels + total rows + partial row
												curLine[i] = rule[n*n*n*n*n*k + n*n*n*n*l + n*n*n*m + n*n*p + n*q + r];
												drawPixel(i,j,rule[n*n*n*n*n*k + n*n*n*n*l + n*n*n*m + n*n*p + n*q + r]);
											}
										}
									}
								}
							}
						}
					}
				}

				// move up the rows
				for(var t=0; t<firstrows-1; t++) {
					for(var s=0; s < width/mag; s++) {
						storedLines[s][t] = storedLines[s][t+1];
					}
				}
				for(var s=0; s < width/mag; s++) {
					storedLines[s][firstrows-1] = curLine[s];
				}
			}
		}

		var date1 = new Date();
		time1 = date1.getTime();
		var delta_t = time1 - time0;
		document.outform.output.value += '\n' + "Drawing completed in " + delta_t + " milliseconds.";
	}
	else { alert('You need a better web browser to see this.'); }
}
