var x = 150;
var y = 150;
var x_mouse, y_mouse, dragHoldX, dragHoldY, mouseX, mouseY;
var dx = 2;
var dy = 4;
var canvas;
var ctx;
var width = 750;//window.innerWidth;
var height = 500;//window.innerHeight;
var WIDTH = 750;//window.innerWidth;
var HEIGHT = 500;//window.innerHeight;
var time0 = 0;
var time1 = 0;
var g;
var dragging = false;
var dragIndex = 0;
var t_default = 3;
var c_default = "#000000";
var type = "rand";
var N = 7;
var M = 2;
var canvasUtil;

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

function range(n) {
  return [...Array(n).keys()];
}

class Vertex {
	constructor(n, x ,y) {
		this.name = n; // a unique integer
		this.xCoord = Math.floor(x); // need to round?
		this.yCoord = Math.floor(y);
		this.color = color_default;
		this.radius = rad_default;
		this.halo = false;
		this.neighbors = []; // a list names of neighboring vertices
		this.selected = false;
	}

	draw(ctx) {
		if (this.halo) {
      canvasUtil.drawDisk(this.xCoord, this.yCoord, this.radius + rad_halo, color_halo);
		}

    canvasUtil.drawDisk(this.xCoord, this.yCoord, this.radius, this.selected ? color_selected : this.color);
	}

	updatePosition(x, y) {
		this.xCoord = Math.floor(x);
		this.yCoord = Math.floor(y);
	}

	updateColor(color) {
		this.color = color;
	}

	updateRadius(radius) {
		this.radius = radius;
	}

	isEqual(v) {
		if (this.xCoord == v.xCoord && this.yCoord == v.yCoord) {
			return true;
		} else {
		  return false;
		}
	}

	hitTestVertex(hitX, hitY) {
		var dx = this.xCoord - hitX;
		var dy = this.yCoord - hitY;
		return (dx * dx + dy * dy < this.radius * this.radius);
	}

	getDegree() {
		return this.neighbors.length;
	}

	deleteNeighbor(n) {
		var i = this.neighbors.indexOf(n);
		if (i != -1) {
			var throwaway = this.neighbors.splice(i, 1);
    }
	}

	printVertexData() {
		var str = `vertex ${this.name} (${this.xCoord}, ${this.yCoord}) [${this.neighbors.join(" ")}]`;
		// for (var i=0; i<this.neighbors.length; i++)
		// 	str += " " + this.neighbors[i];
		//
		// str += "] ";
		return str;
	}
}


class Edge {
	constructor(v, w) {
		if (v.isEqual(w)) {
			return false;
		} else {
			this.v0 = v;
			this.v1 = w;
			this.color = color_default;
			this.thickness = thickness_default;
			v.neighbors.push(w.name);
			w.neighbors.push(v.name);
			this.halo = false;
		}
	}

  draw(ctx) {
		if (this.halo) {
      canvasUtil.drawLine(
        this.v0.xCoord,
        this.v0.yCoord,
        this.v1.xCoord,
        this.v1.yCoord,
        color_halo,
        width_halo
      );
		}

    canvasUtil.drawLine(
      this.v0.xCoord,
      this.v0.yCoord,
      this.v1.xCoord,
      this.v1.yCoord,
      this.selected ? color_selected : this.color,
      this.thickness
    )
  }

  hitTestEdge(hitX, hitY) {
		//document.outform.output.value += "hit testing edge" + '\n';
		var x0 = this.v0.xCoord;
		var y0 = this.v0.yCoord;
		var x1 = this.v1.xCoord;
		var y1 = this.v1.yCoord;

		if (pDistance(hitX, hitY, x0, y0, x1, y1) < edgeClick &&
			!this.v0.hitTestVertex(hitX, hitY) &&
			!this.v1.hitTestVertex(hitX, hitY)) {
			return true;
		} else {
			return false;
		}
	}

  updateColor(color) {
	  this.color = col;
  }

  updateThickness(t) {
	  this.thickness = t;
  }
}

class Graph {
	constructor(vertices, edges) {
		this.vertices = vertices;
		this.edges = edges;
		this.selectedVertexIndex = -1;
		this.selectedEdgeIndex = -1;
		//document.outform.output.value += "graph instantiated" + '\n';
	}

  draw(ctx) {
	  this.edges.forEach(e => e.draw(ctx));
	  this.vertices.forEach(v => v.draw(ctx));
	}

  addVertex(v) {
		this.vertices.length++;
		this.vertices[this.vertices.length - 1] = v;
		//document.outform.output.value += "added vertex" + '\n';
  }

  addEdge(e) {
		this.edges.length++;
		this.edges[this.edges.length - 1] = e;
		//document.outform.output.value += "added edge" + '\n';
  }

	getAdjacencyMatrix() {
		var L = this.vertices.length;
		var throwaway = 0;
		var matrix = [];
		for (var i=0; i<L; i++) {
			matrix[i] = [];
			for (var j=0; j<L; j++) {
				if (this.vertices[i].neighbors.indexOf(this.vertices[j].name) == -1) {
					matrix[i][j] = 0;
        }	else {
          matrix[i][j] = 1;
        }
			}
		}

		return matrix;
	}

	resetHalos() {
		this.vertices.forEach(v => v.halo = false);
		this.edges.forEach(e => e.halo = false);
	}

	getVertexByName(n) {
		for (var i=0; i<this.vertices.length; i++) {
			if (this.vertices[i].name == n) {
				return this.vertices[i];
      }
    }
	}

	vertexIsInTriangle(v) {
		// if degree is 2
		if (v.neighbors.length == 2) {
			// is neighbor 0 in the list of neighbors of neighbor 1?
			var n0 = v.neighbors[0];
			var v1 = this.getVertexByName(v.neighbors[1]);
			if (v1.neighbors.indexOf(n0) != -1) {
				return true;
			} else {
        return false;
      }
		}
		else return false;
	}

	deleteVertex(v) {
		var throwaway = 0;
		var delIndex = -1;

		// remove all edges containing v
		for (var j=0; j<v.neighbors.length; j++) {
			this.deleteEdgeByVertexNames(v.name, v.neighbors[j]);
		}

		// remove v from all neighbors' neighbor lists
		for (var i=0; i<v.neighbors.length; i++) {
			var w = this.getVertexByName(v.neighbors[i]);
			delIndex = w.neighbors.indexOf(v.name);
			throwaway = w.neighbors.splice(delIndex,1);
		}

		// remove v from list of vertices
		delIndex = this.vertices.indexOf(v);
		this.vertices.splice(delIndex, 1);
	}

	deleteEdgeByVertexNames(n0, n1) {
		// warning: this does not update vertex neighbor lists!
		var throwaway = 0;
		for (var i=0; i<this.edges.length; i++) {
			if( (n0==this.edges[i].v0.name && n1==this.edges[i].v1.name) ||
			    (n0==this.edges[i].v1.name && n1==this.edges[i].v0.name) ) {
				throwaway = this.edges.splice(i, 1);
				i = this.edges.length;
			}
		}
	}

	deleteEdgeByIndex(i) {
		// remove neighbors
		this.edges[i].v0.deleteNeighbor(this.edges[i].v1.name);
		this.edges[i].v1.deleteNeighbor(this.edges[i].v0.name);
		// remove the edge
		var throwaway = this.edges.splice(i, 1);
  }

	seriesReduce() {
		var i = this.selectedVertexIndex;
		this.vertices[i].selected = false;

		if (this.vertices[i].neighbors.length == 2 &&
		    !this.vertexIsInTriangle(this.vertices[i])) {

			//get neighbors
			var v0 = this.getVertexByName(this.vertices[i].neighbors[0]);
			var v1 = this.getVertexByName(this.vertices[i].neighbors[1]);

			// delete the vertex and incident edges
			this.deleteVertex(this.vertices[i]);

			// add new edge
			this.addEdge( new Edge(v0,v1) );
		}

		this.selectedVertexIndex = -1;
	}

	isIsomorphicToKn(n) {
		if (this.vertices.length == n) {
			for (var i=0; i<this.vertices.length; i++) {
				if (this.vertices[i].getDegree() != n-1)
					return false;
			}
			return true;
		}
		else return false;
	}

	isIsomorphicToK33() {
		if (this.vertices.length != 6) {
			//document.outform.output.value += "wrong # of vertices " + '\n';
			return false;
		}

		for (var i=0; i<this.vertices.length; i++) {
			if (this.vertices[i].getDegree() != 3) {
				//document.outform.output.value += "wrong degrees " + '\n';
				return false;
			}
    }

		var k33 = completeBipartiteGraph(3,3);
		//printMatrix(k33);
		var mk33 = k33.getAdjacencyMatrix();

		// for each permutation of the indices of the vertices
		var perm = permute([0, 1, 2, 3, 4, 5]);
		var P = 720; // =6!
		var curIndices = [];
		var matrix = [];

		for (var k=0; k<P; k++) {
			curIndices = perm.slice(k, k + 1);
			//document.outform.output.value += "curIndices = " + curIndices + '\n';
			matrix = [];
			for(var i=0; i<6; i++) {
				//document.outform.output.value += "this.V.length = " + this.vertices.length +
				//					", trying to access element " + curIndices[0][i] + '\n';

				matrix[i] = [];
				for (var j=0; j<6; j++) {
					if (this.vertices[curIndices[0][i]].neighbors.indexOf(
						this.vertices[curIndices[0][j]].name) == -1) {
						matrix[i][j] = 0;
					} else {
            matrix[i][j] = 1;
          }
				}
			}
			//printMatrix(matrix);

			if (equalMatrices(matrix, mk33)) {
				//printMatrix(matrix);
				return true;
			}
		}
		return false;
	}

	isPlanarDrawing() {
		//check that no two edges intersect
		for (var i=0; i<this.edges.length; i++) {
			for (var j=i+1; j<this.edges.length; j++) {
				if (intersects(
				g.edges[i].v0.xCoord, g.edges[i].v0.yCoord,
				g.edges[i].v1.xCoord, g.edges[i].v1.yCoord,
				g.edges[j].v0.xCoord, g.edges[j].v0.yCoord,
				g.edges[j].v1.xCoord, g.edges[j].v1.yCoord)) {
					return false;
        }
      }
    }
		return true;
	}
}

function randomGraph(num_vertices, canvas_width, canvas_height) {
	var R = Math.min(canvas_width, canvas_height) / 3;
	var theta = 0;
	var x0 = canvas_width / 2;
	var y0 = canvas_height / 2;
	var flip = 0;

	var G = new Graph([], []);

	for (var i=0; i<num_vertices; i++) {
		theta = 2 * Math.PI * i / num_vertices - Math.PI / 2;
		G.addVertex(new Vertex(i, R * Math.cos(theta) + x0, R * Math.sin(theta) + y0));
	}

	for (var j=0; j<num_vertices; j++) {
		for (var k=j+1; k<num_vertices; k++) {
			flip = Math.random();
			if (flip > flip_prob) {
				G.addEdge(new Edge(G.vertices[j], G.vertices[k]));
			}
		}
	}

	return G;
}

function completeGraph(num_vertices, canvas_width, canvas_height) {
	var R = Math.min(canvas_width, canvas_height) / 3;
	var theta = 0;
	var x0 = canvas_width / 2;
	var y0 = canvas_height / 2;

	var G = new Graph([],[]);

	for (var i=0; i<num_vertices; i++) {
		theta = 2 * Math.PI * i / num_vertices - Math.PI / 2;
		G.addVertex(new Vertex(i, R * Math.cos(theta) + x0, R * Math.sin(theta) + y0));
	}

	for (var j=0; j<num_vertices; j++) {
		for (var k=j+1; k<num_vertices; k++) {
			G.addEdge(new Edge(G.vertices[j], G.vertices[k]));
    }
  }

	return G;
}

function completeBipartiteGraph(num_vertices_1, num_vertices_2, canvas_width, canvas_height) {
	// assume n>0, m>0
	var Gr = new Graph([], []);

	// first group of n vertices
	for (var i=0; i<num_vertices_1; i++) {
		Gr.addVertex(new Vertex(i + 1, (i + 1) * canvas_width / (num_vertices_1 + 1), canvas_height / 4));
  }

	// second group of m vertices
	for (var j=0; j<num_vertices_2; j++) {
		Gr.addVertex(new Vertex(-j - 1, (j + 1) * canvas_width / (num_vertices_2 + 1), 3 * canvas_height / 4));
  }

	// edges
	for (var i=0; i<num_vertices_1; i++) {
		for (var j=0; j<num_vertices_2; j++) {
			Gr.addEdge(new Edge(Gr.vertices[i], Gr.vertices[num_vertices_1 + j]));
    }
  }

	return Gr;
}

function gridGraph(num_rows, num_cols, canvas_width, canvas_height) {
	// assume n>0, m>0
	var Gr = new Graph([], []);

	for (var i=0; i<num_cols; i++) {
		for (var j=0; j<num_rows; j++) {
      let v_id = i * num_rows + j + 1;
      let v_x = (i + 1) * canvas_width / (num_cols + 1);
      let v_y = (j + 1) * canvas_height / (num_rows + 1);
			Gr.addVertex(new Vertex(v_id, v_x, v_y));
    }
  }

	for (var i=0; i<num_cols; i++) {
		for (var j=0; j<num_rows-1; j++) {
			Gr.addEdge(new Edge(Gr.getVertexByName(i * num_rows + j + 1), Gr.getVertexByName(i * num_rows + j + 2)));
    }
  }

	for (var j=0; j<num_rows; j++) {
		for (var i=0; i<num_cols-1; i++) {
			Gr.addEdge(new Edge(Gr.getVertexByName(i * num_rows + j + 1), Gr.getVertexByName((i + 1) * num_rows + j + 1)));
    }
  }

	return Gr;
}

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
}

function printMatrix(m) {
	for (var i=0; i<m.length; i++) {
		for (var j=0; j<m[0].length; j++) {
			document.outform.output.value += " " + m[i][j];
		}
		document.outform.output.value += '\n';
	}
}

function equalMatrices(A, B) {
	for (var i=0; i<A.length; i++) {
		for (var j=0; j<A[i].length; j++) {
			if (A[i][j] != B[i][j]) {
				return false;
      }
    }
  }
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
}

function intersects(a, b, c, d, p, q, r, s) {
	// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
	//var det, gamma, lambda;
	var det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	}
	else {
		var lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		var gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
}


function draw() {
	canvasUtil.clearCanvas();

	for (var i=0; i<g.vertices.length; i++) {
		if (g.vertices[i].hitTestVertex(x_mouse, y_mouse)) {
			g.vertices[i].halo = true;
    }
  }

	for (var j=0; j<g.edges.length; j++) {
		if (g.edges[j].hitTestEdge(x_mouse, y_mouse)) {
			g.edges[j].halo = true;
    }
  }

	g.draw(ctx);
	g.resetHalos();
}

function ev_mousemove2(ev) { // TODO: refactor so that vars here match canvasUtil.js conventions
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
		if (g.vertices[i].hitTestVertex(x_mouse,y_mouse)) {
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
	for (var i=0; i < g.vertices.length; i++) {
		if (g.vertices[i].hitTestVertex(x_mouse,y_mouse)) {
			//document.outform.output.value += g.vertices[i].printVertexData() + '\n';

			// deselect a selected vertex
			if (g.vertices[i].selected && g.selectedVertexIndex != -1) {
				g.vertices[i].selected = false;
				g.selectedVertexIndex = -1;
				//document.outform.output.value += "deselected vertex " + g.vertices[i].name + '\n';
			}
			// select an unselected vertex
			else if (!g.vertices[i].selected && g.selectedVertexIndex == -1) {
				g.vertices[i].selected = true;
				g.selectedVertexIndex = i;
				//document.outform.output.value += "selected vertex " + g.vertices[i].name + '\n';
			}
		}
	}

	for (var j=0; j < g.edges.length; j++) {
		if (g.edges[j].hitTestEdge(x_mouse,y_mouse)) {
			// deselect a selected edge
			if (g.edges[j].selected && g.selectedEdgeIndex != -1) {
				g.edges[j].selected = false;
				g.selectedEdgeIndex = -1;
				//document.outform.output.value += "deselected edge (" + g.edges[j].v0.name + "," + g.edges[j].v1.name + ")" + '\n';
			}
			// select an unselected edge
			else if (!g.edges[j].selected && g.selectedEdgeIndex == -1) {
				g.edges[j].selected = true;
				g.selectedEdgeIndex = j;
				//document.outform.output.value += "selected edge (" + g.edges[j].v0.name + "," + g.edges[j].v1.name + ")" + '\n';
			}
		}
	}
}

function reduce() {
	if (g.selectedVertexIndex != -1) {
		g.seriesReduce();
		g.selectedVertexIndex = -1;
	}
}

function deleteAVertex() {
	if (g.selectedVertexIndex != -1) {
		g.deleteVertex(g.vertices[g.selectedVertexIndex]);
		g.selectedVertexIndex = -1;
	}
}

function deleteAnEdge() {
	if (g.selectedEdgeIndex != -1) {
		g.deleteEdgeByIndex(g.selectedEdgeIndex);
		g.selectedEdgeIndex = -1;
	}
}

function isItK5() {
	if (g.isIsomorphicToKn(5)) {
		canvasUtil.println("  isomorphic to K5: yes");
	} else {
		canvasUtil.println("  isomorphic to K5: no");
	}
}

function isItK33() {
	if (g.isIsomorphicToK33()) {
		canvasUtil.println("  isomorphic to K33: yes");
	} else {
		canvasUtil.println("  isomorphic to K33: no");
	}
}

function isPlanar() {
	if (g.isPlanarDrawing()) {
		canvasUtil.println("  planar drawing: yes");
	} else {
		canvasUtil.println("  planar drawing: no");
	}
}

function updateGraph(newType, newN, newM) {
	//document.outform.output.value += "called updateGraph with "
	//				+ newType + " " + newN + " " + newM + '\n';

	if (newType == "rand")
		type = "rand";
	else if (newType == "comp")
		type = "comp";
	else if (newType == "bipt")
		type = "bipt";
	else if (newType == "grid")
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
	//document.outform.output.value = "";

	// get the canvas element using the DOM
	canvas = document.getElementById("canvas");
	canvas.width = WIDTH;
	canvas.height = HEIGHT;

	// Make sure we don't execute when canvas isn't supported
	if (canvas.getContext) {
		// use getContext to use the canvas for drawing
		ctx = canvas.getContext('2d');
		canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);

		// Attach the event handlers
		canvas.addEventListener('mousemove', ev_mousemove2, false);
		canvas.addEventListener("mousedown", mouseDownListener, false);
		window.addEventListener("mouseup", mouseUpListener, false);
		window.addEventListener("dblclick", mouseDblclickListener, false);

		// which graph to make?
		//document.outform.output.value += "init called with "
		//			+ type + " " + N + " " + M + '\n';

		if (type == "rand") {
			g = randomGraph(N, width, height);
			canvasUtil.println(`drew random graph with ${N} vertices`);
		} else if (type == "comp") {
			g = completeGraph(N, width, height);
			canvasUtil.println(`drew complete graph with ${N} vertices`);
		} else if (type == "bipt") {
			g = completeBipartiteGraph(N, M, width, height);
			canvasUtil.println(`drew complete bipartite graph with ${N}, ${M} vertices`);
		} else if (type == "grid") {
			g = gridGraph(N, M, width, height);
			canvasUtil.println(`drew grid graph with ${N} x ${M} vertices`);
		}

		return setInterval(draw, 10);
	}
	else { alert('You need a better web browser to see this.'); }
}
