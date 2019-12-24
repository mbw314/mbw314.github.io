var color_default = "#000000";
var color_selected = "#FF0000";
var color_halo = "#0000FF";
var flip_prob = 0.35;
var rad_default = 10;
var rad_halo = 2;
var width_halo = 4;
var thickness_default = 2;
var edgeClick = 5;
var permArr = [], usedChars = [];

function Vertex(n, x ,y) {
	this.name = n; // a unique integer
	this.xCoord = Math.floor(x);
	this.yCoord = Math.floor(y);
	this.color = color_default;
	this.radius = rad_default;
	this.halo = false;
	this.neighbors = []; // a list names of neighboring vertices
	this.selected = false;
}

Vertex.prototype.drawVertex = function(c) {
	if( this.halo ) {
		c.fillStyle = color_halo;
		c.beginPath();
		c.arc(this.xCoord,
			this.yCoord,
			this.radius + rad_halo, 0, Math.PI*2, true);
		c.closePath();
		c.fill();
	}

	if( this.selected )
		c.fillStyle = color_selected;
	else c.fillStyle = this.color;
	c.beginPath();
	c.arc(this.xCoord,
		this.yCoord,
		this.radius, 0, Math.PI*2, true);
	c.closePath();
	c.fill();
};

Vertex.prototype.updatePosition = function(x,y) {
	this.xCoord = Math.floor(x);
	this.yCoord = Math.floor(y);
};

Vertex.prototype.updateColor = function(col) {
	this.color = col;
};

Vertex.prototype.updateRadius = function(rad) {
	this.radius = rad;
};

Vertex.prototype.isEqual = function(v) {
	if( this.xCoord == v.xCoord && this.yCoord == v.yCoord )
		return true;
	else return false;
}

Vertex.prototype.hitTestVertex = function(hitX,hitY) {
	var dx = this.xCoord - hitX;
	var dy = this.yCoord - hitY;
	return(dx*dx + dy*dy < this.radius*this.radius);
}

Vertex.prototype.getDegree = function() {
	return this.neighbors.length;
};

Vertex.prototype.deleteNeighbor = function(n) {
	var i = this.neighbors.indexOf(n);
	if( i != -1 )
		var throwaway = this.neighbors.splice(i,1);
};

Vertex.prototype.printVertexData = function() {
	var str = "vertex " + this.name + " (" + this.xCoord + "," + this.yCoord + ") [";
	for( var i=0; i<this.neighbors.length; i++ )
		str += " " + this.neighbors[i];

	str += "] ";
	return str;
};

function Edge(v, w) {
	if( v.isEqual(w) ) return false;
	else {
		this.v0 = v;
		this.v1 = w;
		this.color = color_default;
		this.thickness = thickness_default;
		v.neighbors.push(w.name);
		w.neighbors.push(v.name);
		this.halo = false;
	}
}

Edge.prototype.drawEdge = function(c) {
	if( this.halo ) {
		c.strokeStyle = color_halo;
		c.lineWidth = width_halo;
		c.beginPath();
		c.moveTo(this.v0.xCoord,this.v0.yCoord);
		c.lineTo(this.v1.xCoord,this.v1.yCoord);
		c.closePath();
		c.stroke();
	}

	if( this.selected ) {
		c.strokeStyle = color_selected;
	}
	else c.strokeStyle = this.color;
	c.lineWidth = this.thickness;
	c.beginPath();
	c.moveTo(this.v0.xCoord,this.v0.yCoord);
	c.lineTo(this.v1.xCoord,this.v1.yCoord);
	c.closePath();
	c.stroke();
};

Edge.prototype.hitTestEdge = function(hitX, hitY) {
	//document.outform.output.value += "hit testing edge" + '\n';
	var x0 = this.v0.xCoord;
	var y0 = this.v0.yCoord;
	var x1 = this.v1.xCoord;
	var y1 = this.v1.yCoord;

	if( pDistance(hitX,hitY,x0,y0,x1,y1) < edgeClick &&
		!this.v0.hitTestVertex(hitX,hitY) &&
		!this.v1.hitTestVertex(hitX,hitY) )
		return true;
	else return false;
}

Edge.prototype.updateColor = function(col) {
	this.color = col;
};

Edge.prototype.updateThickness = function(t) {
	this.thickness = t;
};

function Graph(V, E) {
	this.vertices = V;
	this.edges = E;
	this.selectedVertexIndex = -1;
	this.selectedEdgeIndex = -1;
	//document.outform.output.value += "graph instantiated" + '\n';
}

Graph.prototype.drawGraph = function(c) {
	for(var i=0; i<this.edges.length; i++)
		this.edges[i].drawEdge(c);
	for(var j=0; j<this.vertices.length; j++)
		this.vertices[j].drawVertex(c);
};

Graph.prototype.addVertex = function(v) {
	this.vertices.length++;
	this.vertices[this.vertices.length-1] = v;
	//document.outform.output.value += "added vertex" + '\n';
};

Graph.prototype.addEdge = function(e) {
	this.edges.length++;
	this.edges[this.edges.length-1] = e;
	//document.outform.output.value += "added edge" + '\n';
};

Graph.prototype.getAdjMatrix = function() {
	var L = this.vertices.length;
	var throwaway = 0;
	var matrix = [];
	for(var i=0; i<L; i++) {
		matrix[i] = [];
		for(var j=0; j<L; j++) {
			if( this.vertices[i].neighbors.indexOf(this.vertices[j].name) == -1 )
				matrix[i][j] = 0;
			else matrix[i][j] = 1;
		}
	}

	return matrix;
};

Graph.prototype.resetHalos = function() {
	for(var j=0; j<this.vertices.length; j++)
		this.vertices[j].halo = false;
	for(var k=0; k<this.edges.length; k++)
		this.edges[k].halo = false;
};

Graph.prototype.getVertexByName = function(n) {
	for( var i=0; i<this.vertices.length; i++ )
		if( this.vertices[i].name == n )
			return this.vertices[i];
};

Graph.prototype.vertexIsInTriangle = function(v) {
	// if degree is 2
	if( v.neighbors.length == 2 ) {
		// is neighbor 0 in the list of neighbors of neighbor 1?
		var n0 = v.neighbors[0];
		var v1 = this.getVertexByName(v.neighbors[1]);
		if( v1.neighbors.indexOf(n0) != -1 )
			return true;
		else return false;
	}
	else return false;
}

Graph.prototype.deleteVertex = function(v) {
	var throwaway = 0;
	var delIndex = -1;

	// remove all edges containing v
	for( var j=0; j<v.neighbors.length; j++ ) {
		this.deleteEdgeByVertexNames(v.name,v.neighbors[j]);
	}

	// remove v from all neighbors' neighbor lists
	for( var i=0; i<v.neighbors.length; i++ ) {
		var w = this.getVertexByName(v.neighbors[i]);
		delIndex = w.neighbors.indexOf(v.name);
		throwaway = w.neighbors.splice(delIndex,1);
	}

	// remove v from list of vertices
	delIndex = this.vertices.indexOf(v);
	this.vertices.splice(delIndex,1);
};

Graph.prototype.deleteEdgeByVertexNames = function(n0,n1) {
	// warning: this does not update vertex neighbor lists!
	var throwaway = 0;
	for( var i=0; i<this.edges.length; i++ ) {

		if( (n0==this.edges[i].v0.name && n1==this.edges[i].v1.name) ||
		    (n0==this.edges[i].v1.name && n1==this.edges[i].v0.name) ) {
			throwaway = this.edges.splice(i,1);
			i = this.edges.length;
		}
	}
};

Graph.prototype.deleteEdgeByIndex = function(i) {
	// remove neighbors
	this.edges[i].v0.deleteNeighbor(this.edges[i].v1.name);
	this.edges[i].v1.deleteNeighbor(this.edges[i].v0.name);
	// remove the edge
	var throwaway = this.edges.splice(i,1);
};

Graph.prototype.seriesReduce = function() {
	var i = this.selectedVertexIndex;
	this.vertices[i].selected = false;

	if( this.vertices[i].neighbors.length == 2 &&
	    !this.vertexIsInTriangle(this.vertices[i]) ) {

		//get neighbors
		var v0 = this.getVertexByName(this.vertices[i].neighbors[0]);
		var v1 = this.getVertexByName(this.vertices[i].neighbors[1]);

		// delete the vertex and incident edges
		this.deleteVertex(this.vertices[i]);

		// add new edge
		this.addEdge( new Edge(v0,v1) );
	}

	this.selectedVertexIndex = -1;
};

Graph.prototype.isIsomorphicToKn = function(n) {
	if( this.vertices.length == n ) {
		for( var i=0; i<this.vertices.length; i++ ) {
			if( this.vertices[i].getDegree() != n-1 )
				return false;
		}
		return true;
	}
	else return false;
};

Graph.prototype.isIsomorphicToK33 = function() {
	if( this.vertices.length != 6 ) {
		//document.outform.output.value += "wrong # of vertices " + '\n';
		return false;
	}

	for( var i=0; i<this.vertices.length; i++ )
		if( this.vertices[i].getDegree() != 3 ) {
			//document.outform.output.value += "wrong degrees " + '\n';
			return false;
		}

	var k33 = completeBipartiteGraph(3,3);
	//printMatrix(k33);
	var mk33 = k33.getAdjMatrix();

	// for each permutation of the indices of the vertices
	var perm = permute([0,1,2,3,4,5]);
	var P = 720; // =6!
	var curIndices = [];
	var matrix = [];

	for( var k=0; k<P; k++ ) {
		curIndices = perm.slice(k,k+1);
		//document.outform.output.value += "curIndices = " + curIndices + '\n';
		matrix = [];
		for(var i=0; i<6; i++) {
			//document.outform.output.value += "this.V.length = " + this.vertices.length +
			//					", trying to access element " + curIndices[0][i] + '\n';

			matrix[i] = [];
			for(var j=0; j<6; j++) {

				if( this.vertices[curIndices[0][i]].neighbors.indexOf(
					this.vertices[curIndices[0][j]].name) == -1 )
					matrix[i][j] = 0;
				else matrix[i][j] = 1;
			}
		}
		//printMatrix(matrix);

		if( equalMatrices(matrix,mk33) ) {
			//printMatrix(matrix);
			return true;
		}

	}
	return false;
};

Graph.prototype.isPlanarDrawing = function() {
	//check that no two edges intersect
	for( var i=0; i<this.edges.length; i++ )
		for( var j=i+1; j<this.edges.length; j++ )
			if( intersects(
			g.edges[i].v0.xCoord,g.edges[i].v0.yCoord,
			g.edges[i].v1.xCoord,g.edges[i].v1.yCoord,
			g.edges[j].v0.xCoord,g.edges[j].v0.yCoord,
			g.edges[j].v1.xCoord,g.edges[j].v1.yCoord) )
				return false;

	return true;
};

function randomGraph(n, w, h) {
	var R = Math.min(w, h)/3;
	var theta = 0;
	var x0 = w/2;
	var y0 = h/2;
	var flip = 0;

	var G = new Graph([],[]);

	for( var i=0; i<n; i++ ) {
		theta = 2*Math.PI*i/n - Math.PI/2;
		G.addVertex( new Vertex(i,R*Math.cos(theta) + x0,R*Math.sin(theta) + y0) );
	}

	for( var j=0; j<n; j++ ) {
		for( var k=j+1; k<n; k++) {
			flip = Math.random();
			if( flip > flip_prob ) {
				G.addEdge( new Edge(G.vertices[j],G.vertices[k]) );
			}
		}
	}

	return G;
};

function completeGraph(n, w, h) {
	var R = Math.min(w,h)/3;
	var theta = 0;
	var x0 = w/2;
	var y0 = h/2;

	var G = new Graph([],[]);

	for( var i=0; i<n; i++ ) {
		theta = 2*Math.PI*i/n - Math.PI/2;
		G.addVertex( new Vertex(i,R*Math.cos(theta) + x0,R*Math.sin(theta) + y0) );
	}

	for( var j=0; j<n; j++ )
		for( var k=j+1; k<n; k++)
			G.addEdge( new Edge(G.vertices[j],G.vertices[k]) )

	return G;
};

function completeBipartiteGraph(n, m, w, h) {
	// assume n>0, m>0
	var Gr = new Graph([],[]);

	// first group of n vertices
	for( var i=0; i<n; i++ )
		Gr.addVertex( new Vertex(i+1,(i+1)*w/(n+1),h/4) );

	// second group of m vertices
	for( var j=0; j<m; j++ )
		Gr.addVertex( new Vertex(-j-1,(j+1)*w/(m+1),3*h/4) );

	// edges
	for( var k=0; k<n; k++ )
		for( var l=0; l<m; l++)
			Gr.addEdge( new Edge(Gr.vertices[k],Gr.vertices[n+l]) );

	return Gr;
};

function gridGraph(n, m, w, h) {
	// assume n>0, m>0
	var Gr = new Graph([],[]);

	for( var i=0; i<m; i++ )
		for( var j=0; j<n; j++ ) {
			Gr.addVertex( new Vertex(i*n+j+1,(i+1)*w/(m+1),(j+1)*h/(n+1)) );
			//var temp = i*n+j+1;
			//document.outform.output.value += " " + temp;
		}

	for( var i=0; i<m; i++ )
		for( var j=0; j<n-1; j++ )
			Gr.addEdge( new Edge(Gr.getVertexByName(i*n+j+1),Gr.getVertexByName(i*n+j+2)) );


	for( var j=0; j<n; j++ )
		for( var i=0; i<m-1; i++ )
			Gr.addEdge( new Edge(Gr.getVertexByName(i*n+j+1),Gr.getVertexByName((i+1)*n+j+1)) );

	return Gr;
};

function pDistance(x, y, x1, y1, x2, y2) {
	var A = x - x1;
	var B = y - y1;
	var C = x2 - x1;
	var D = y2 - y1;

	var dot = A * C + B * D;
	var len_sq = C * C + D * D;
	var param = dot / len_sq;

	var xx, yy;

	if (param < 0 || (x1 == x2 && y1 == y2)) {
		xx = x1;
		yy = y1;
	}
	else if (param > 1) {
		xx = x2;
		yy = y2;
	}
	else {
		xx = x1 + param * C;
		yy = y1 + param * D;
	}

	var dx = x - xx;
	var dy = y - yy;
	return Math.sqrt(dx * dx + dy * dy);
};

function printMatrix(m) {

	for( var i=0; i<m.length; i++ ) {
		for( var j=0; j<m[0].length; j++ ) {
			document.outform.output.value += " " + m[i][j];
		}
		document.outform.output.value += '\n';
	}
};

function equalMatrices(A, B) {
	for( var i=0; i<A.length; i++ )
		for( var j=0; j<A[i].length; j++ )
			if( A[i][j] != B[i][j] )
				return false;

	return true;
}

function permute(input) {
	var i, ch;
	for (i = 0; i < input.length; i++) {
		ch = input.splice(i, 1)[0];
		usedChars.push(ch);
		if (input.length == 0) {
			permArr.push(usedChars.slice());
		}
		permute(input);
		input.splice(i, 0, ch);
		usedChars.pop();
	}
	return permArr;
};

function intersects(a, b, c, d, p, q, r, s) {
	// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	}
	else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
};


var x = 150;
var y = 150;
var x_mouse, y_mouse, dragHoldX, dragHoldY, mouseX, mouseY;
var dx = 2;
var dy = 4;
var canvas,ctx;
var width = 750;//window.innerWidth;
var height = 500;//window.innerHeight;
var WIDTH = 750;//window.innerWidth;
var HEIGHT = 500;//window.innerHeight;
var time0 = 0;
var time1 = 0;
var g = new Graph([],[]);
var dragging = false;
var dragIndex = 0;
var t_default = 3;
var c_default = "#000000";
var type = "rand";
var N = 7;
var M = 2;


function draw() {
	clear_canvas();

	for( var i=0; i<g.vertices.length; i++ )
		if( g.vertices[i].hitTestVertex(x_mouse, y_mouse) )
			g.vertices[i].halo = true;

	for( var j=0; j<g.edges.length; j++ )
		if( g.edges[j].hitTestEdge(x_mouse, y_mouse) )
			g.edges[j].halo = true;

	g.drawGraph(ctx);
	g.resetHalos();
}

function ev_mousemove2 (ev) { // TODO: refactor so that vars here match canvasUtil.js conventions
  const rect = canvas.getBoundingClientRect()
  x_mouse = ev.clientX - rect.left
  y_mouse = ev.clientY - rect.top
}


function mouseMoveListener(evt) {
	var posX;
	var posY;
	var shapeRad = g.vertices[dragIndex].radius;
	var minX = shapeRad;
	var maxX = canvas.width - shapeRad;
	var minY = shapeRad;
	var maxY = canvas.height - shapeRad;
	//getting mouse position correctly
	var bRect = canvas.getBoundingClientRect();
	mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
	mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);

	//clamp x and y positions to prevent object from dragging outside of canvas
	posX = mouseX - dragHoldX;
	posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
	posY = mouseY - dragHoldY;
	posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);

	g.vertices[dragIndex].xCoord = posX;
	g.vertices[dragIndex].yCoord = posY;
}

function mouseDownListener(evt) {
	//document.outform.output.value += "mousedown" + '\n';
	var i;
	//We are going to pay attention to the layering order of the objects so
	//that if a mouse down occurs over more than object, only the topmost one
	//will be dragged.
	var highestIndex = -1;

	//getting mouse position correctly, being mindful of resizing that may
	//have occured in the browser:
	var bRect = canvas.getBoundingClientRect();
	mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
	mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);

	//find which vertex was clicked
	for (i=0; i < g.vertices.length; i++) {
		if( g.vertices[i].hitTestVertex(x_mouse,y_mouse) ) {
			dragging = true;
			if (i > highestIndex) {
				//We will pay attention to the point on the object
				//where the mouse is "holding" the object:
				dragHoldX = mouseX - g.vertices[i].xCoord;
				dragHoldY = mouseY - g.vertices[i].yCoord;
				highestIndex = i;
				dragIndex = i;
			}
		}
	}

	if (dragging) {
		window.addEventListener("mousemove", mouseMoveListener, false);
	}
	canvas.removeEventListener("mousedown", mouseDownListener, false);
	window.addEventListener("mouseup", mouseUpListener, false);

	//code below prevents the mouse down from having an effect on the main
	//browser window:
	if (evt.preventDefault) {
		evt.preventDefault();
	} //standard
	else if (evt.returnValue) {
		evt.returnValue = false;
	} //older IE
	return false;
}

function mouseUpListener(evt) {
	//document.outform.output.value += "mouseup" + '\n';
	g.resetHalos();

	canvas.addEventListener("mousedown", mouseDownListener, false);
	window.removeEventListener("mouseup", mouseUpListener, false);
	if (dragging) {
		dragging = false;
		window.removeEventListener("mousemove", mouseMoveListener, false);
	}
}

function mouseDblclickListener(evt) {
	for( var i=0; i < g.vertices.length; i++) {
		if( g.vertices[i].hitTestVertex(x_mouse,y_mouse) ) {
			//document.outform.output.value += g.vertices[i].printVertexData() + '\n';

			// deselect a selected vertex
			if( g.vertices[i].selected && g.selectedVertexIndex != -1 ) {
				g.vertices[i].selected = false;
				g.selectedVertexIndex = -1;
				//document.outform.output.value += "deselected vertex " + g.vertices[i].name + '\n';
			}
			// select an unselected vertex
			else if( !g.vertices[i].selected && g.selectedVertexIndex == -1 ) {
				g.vertices[i].selected = true;
				g.selectedVertexIndex = i;
				//document.outform.output.value += "selected vertex " + g.vertices[i].name + '\n';
			}
		}
	}

	for( var j=0; j < g.edges.length; j++) {
		if( g.edges[j].hitTestEdge(x_mouse,y_mouse) ) {
			// deselect a selected edge
			if( g.edges[j].selected && g.selectedEdgeIndex != -1 ) {
				g.edges[j].selected = false;
				g.selectedEdgeIndex = -1;
				//document.outform.output.value += "deselected edge (" + g.edges[j].v0.name + "," + g.edges[j].v1.name + ")" + '\n';
			}
			// select an unselected edge
			else if( !g.edges[j].selected && g.selectedEdgeIndex == -1 ) {
				g.edges[j].selected = true;
				g.selectedEdgeIndex = j;
				//document.outform.output.value += "selected edge (" + g.edges[j].v0.name + "," + g.edges[j].v1.name + ")" + '\n';
			}
		}
	}
}

function reduce() {
	if( g.selectedVertexIndex != -1 ) {
		g.seriesReduce();
		g.selectedVertexIndex = -1;
	}
}

function deleteAVertex() {
	if( g.selectedVertexIndex != -1 ) {
		g.deleteVertex(g.vertices[g.selectedVertexIndex]);
		g.selectedVertexIndex = -1;
	}
}

function deleteAnEdge() {
	if( g.selectedEdgeIndex != -1 ) {
		g.deleteEdgeByIndex(g.selectedEdgeIndex);
		g.selectedEdgeIndex = -1;
	}
}

function isItK5() {
	if( g.isIsomorphicToKn(5) )
		document.outform.output.value += "  isomorphic to K5: yes" + '\n';
	else
		document.outform.output.value += "  isomorphic to K5: no" + '\n';
}

function isItK33() {
	if( g.isIsomorphicToK33() )
		document.outform.output.value += "  isomorphic to K33: yes" + '\n';
	else
		document.outform.output.value += "  isomorphic to K33: no" + '\n';
}

function isPlanar() {
	if( g.isPlanarDrawing() )
		document.outform.output.value += "  planar drawing: yes" + '\n';
	else
		document.outform.output.value += "  planar drawing: no" + '\n';
}

function updateGraph(newType, newN, newM) {
	//document.outform.output.value += "called updateGraph with "
	//				+ newType + " " + newN + " " + newM + '\n';

	if( newType == "rand" )
		type = "rand";
	else if( newType == "comp" )
		type = "comp";
	else if( newType == "bipt" )
		type = "bipt";
	else if( newType == "grid" )
		type = "grid";

	N = parseInt(newN);
	M = parseInt(newM);

	//document.outform.output.value += "updated parameters: "
	//				+ type + " " + N + " " + M + '\n';

	init();
}


function init() {
	var date0 = new Date();
	time0 = date0.getTime();
	document.outform.output.value = "";

	// get the canvas element using the DOM
	canvas = document.getElementById("canvas");
	canvas.width = width;
	canvas.height = height;

	// Make sure we don't execute when canvas isn't supported
	if (canvas.getContext){
		// use getContext to use the canvas for drawing
		ctx = canvas.getContext('2d');

		// Attach the event handlers
		canvas.addEventListener('mousemove', ev_mousemove2, false);
		canvas.addEventListener("mousedown", mouseDownListener, false);
		window.addEventListener("mouseup", mouseUpListener, false);
		window.addEventListener("dblclick", mouseDblclickListener, false);

		// which graph to make?
		//document.outform.output.value += "init called with "
		//			+ type + " " + N + " " + M + '\n';

		if( type == "rand" ) {
			g = randomGraph(N,width,height);
			document.outform.output.value += "drew random graph with " + N + " vertices" + '\n';
		} else if( type == "comp" ) {
			g = completeGraph(N,width,height);
			document.outform.output.value += "drew complete graph with " + N + " vertices" + '\n';
		} else if( type == "bipt" ) {
			g = completeBipartiteGraph(N,M,width,height);
			document.outform.output.value += "drew complete bipartite graph with " + N + " + " + M + " vertices" + '\n';
		}
		else if( type == "grid") {
			g = gridGraph(N,M,width,height);
			document.outform.output.value += "drew grid graph with " + N + " x " + M + " vertices" + '\n';
		}

		return setInterval(draw, 10);
	}
	else { alert('You need a better web browser to see this.'); }
}
