let WIDTH = 750;
let HEIGHT = 500;
let canvas;
let canvasUtil;
let ctx;
let mouseX, mouseY, dragHoldX, dragHoldY, mouseDragX, mouseDragY;

let g;
let dragging = false;
let dragIndex = 0;

let COLOR_DEFAULT = "#000000";
let COLOR_SELECTED = "#FF0000";
let COLOR_HALO = "#0000FF";
let FLIP_PROBABILITY = 0.35;
let RADIUS_DEFAULT = 10;
let RADIUS_HALO = 2;
let WIDTH_HALO = 4;
let THICKNESS_DEFAULT = 2;
let EDGE_CLICK = 5;
let permArr = [], usedChars = [];


class Vertex {
  constructor(n, x ,y) {
    this.name = n; // a unique integer
    this.x = Math.floor(x);
    this.y = Math.floor(y);
    this.halo = false;
    this.neighbors = []; // a list names of neighboring vertices
    this.selected = false;
  }

  draw() {
    if (this.halo) {
      canvasUtil.drawDisk(this.x, this.y, RADIUS_DEFAULT + RADIUS_HALO, COLOR_HALO);
    }
    canvasUtil.drawDisk(this.x, this.y, RADIUS_DEFAULT, this.selected ? COLOR_SELECTED : COLOR_DEFAULT);
  }

  updatePosition(x, y) {
    this.x = Math.floor(x);
    this.y = Math.floor(y);
  }

  isEqual(v) {
    if (this.x == v.x && this.y == v.y) {
      return true;
    } else {
      return false;
    }
  }

  hitTestVertex(hitX, hitY) {
    let dx = this.x - hitX;
    let dy = this.y - hitY;
    return (dx * dx + dy * dy < RADIUS_DEFAULT * RADIUS_DEFAULT);
  }

  getDegree() {
    return this.neighbors.length;
  }

  deleteNeighbor(n) {
    let i = this.neighbors.indexOf(n);
    if (i != -1) {
      let throwaway = this.neighbors.splice(i, 1);
    }
  }

  printVertexData() {
    return `vertex ${this.name} (${this.x}, ${this.y}) [${this.neighbors.join(" ")}]`;
  }
}


class Edge {
  constructor(v, w) {
    if (v.isEqual(w)) {
      return false;
    } else {
      this.v0 = v;
      this.v1 = w;
      v.neighbors.push(w.name);
      w.neighbors.push(v.name);
      this.halo = false;
    }
  }

  draw() {
    if (this.halo) {
      canvasUtil.drawLine(this.v0.x, this.v0.y, this.v1.x, this.v1.y, COLOR_HALO, WIDTH_HALO);
    }
    canvasUtil.drawLine(this.v0.x, this.v0.y, this.v1.x, this.v1.y, this.selected ? COLOR_SELECTED : COLOR_DEFAULT, THICKNESS_DEFAULT);
  }

  hitTestEdge(hitX, hitY) {
    //document.outform.output.value += "hit testing edge" + '\n';
    let x0 = this.v0.x;
    let y0 = this.v0.y;
    let x1 = this.v1.x;
    let y1 = this.v1.y;

    if (pDistance(hitX, hitY, x0, y0, x1, y1) < EDGE_CLICK &&
      !this.v0.hitTestVertex(hitX, hitY) &&
      !this.v1.hitTestVertex(hitX, hitY)) {
      return true;
    } else {
      return false;
    }
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

  draw() {
    this.edges.forEach(e => e.draw());
    this.vertices.forEach(v => v.draw());
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
    let L = this.vertices.length;
    let throwaway = 0;
    let matrix = [];
    for (let i=0; i<L; i++) {
      matrix[i] = [];
      for (let j=0; j<L; j++) {
        if (this.vertices[i].neighbors.indexOf(this.vertices[j].name) == -1) {
          matrix[i][j] = 0;
        }  else {
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
    for (let i=0; i<this.vertices.length; i++) {
      if (this.vertices[i].name == n) {
        return this.vertices[i];
      }
    }
  }

  vertexIsInTriangle(v) {
    // if degree is 2
    if (v.neighbors.length == 2) {
      // is neighbor 0 in the list of neighbors of neighbor 1?
      let n0 = v.neighbors[0];
      let v1 = this.getVertexByName(v.neighbors[1]);
      if (v1.neighbors.indexOf(n0) != -1) {
        return true;
      } else {
        return false;
      }
    }
    else return false;
  }

  deleteVertex(v) {
    // remove all edges containing v
    for (let j=0; j<v.neighbors.length; j++) {
      this.deleteEdgeByVertexNames(v.name, v.neighbors[j]);
    }

    // remove v from all neighbors' neighbor lists
    for (let i=0; i<v.neighbors.length; i++) {
      let w = this.getVertexByName(v.neighbors[i]);
      let delIndex = w.neighbors.indexOf(v.name);
      w.neighbors.splice(delIndex,1);
    }

    // remove v from list of vertices
    let delIndex = this.vertices.indexOf(v);
    this.vertices.splice(delIndex, 1);
  }

  deleteEdgeByVertexNames(n0, n1) {
    // warning: this does not update vertex neighbor lists!
    for (let i=0; i<this.edges.length; i++) {
      if ((n0==this.edges[i].v0.name && n1==this.edges[i].v1.name) ||
          (n0==this.edges[i].v1.name && n1==this.edges[i].v0.name)) {
        this.edges.splice(i, 1);
        i = this.edges.length;
      }
    }
  }

  deleteEdgeByIndex(i) {
    // remove neighbors
    this.edges[i].v0.deleteNeighbor(this.edges[i].v1.name);
    this.edges[i].v1.deleteNeighbor(this.edges[i].v0.name);
    // remove the edge
    this.edges.splice(i, 1);
  }

  seriesReduce() {
    let i = this.selectedVertexIndex;
    this.vertices[i].selected = false;

    if (this.vertices[i].neighbors.length == 2 &&
        !this.vertexIsInTriangle(this.vertices[i])) {

      //get neighbors
      let v0 = this.getVertexByName(this.vertices[i].neighbors[0]);
      let v1 = this.getVertexByName(this.vertices[i].neighbors[1]);

      // delete the vertex and incident edges
      this.deleteVertex(this.vertices[i]);

      // add new edge
      this.addEdge(new Edge(v0, v1));
    }

    this.selectedVertexIndex = -1;
  }

  isIsomorphicToKn(n) {
    if (this.vertices.length == n) {
      for (let i=0; i<this.vertices.length; i++) {
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

    for (let i=0; i<this.vertices.length; i++) {
      if (this.vertices[i].getDegree() != 3) {
        //document.outform.output.value += "wrong degrees " + '\n';
        return false;
      }
    }

    let k33 = Graph.completeBipartiteGraph(3, 3);
    //printMatrix(k33);
    let mk33 = k33.getAdjacencyMatrix();

    // for each permutation of the indices of the vertices
    let perm = permute([0, 1, 2, 3, 4, 5]);
    let P = 720; // =6!
    let curIndices = [];
    let matrix = [];

    for (let k=0; k<P; k++) {
      curIndices = perm.slice(k, k + 1);
      //document.outform.output.value += "curIndices = " + curIndices + '\n';
      matrix = [];
      for (let i=0; i<6; i++) {
        //document.outform.output.value += "this.V.length = " + this.vertices.length +
        //          ", trying to access element " + curIndices[0][i] + '\n';

        matrix[i] = [];
        for (let j=0; j<6; j++) {
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
    for (let i=0; i<this.edges.length; i++) {
      for (let j=i+1; j<this.edges.length; j++) {
        if (linesIntersect(
            g.edges[i].v0.x, g.edges[i].v0.y,
            g.edges[i].v1.x, g.edges[i].v1.y,
            g.edges[j].v0.x, g.edges[j].v0.y,
            g.edges[j].v1.x, g.edges[j].v1.y)) {
          return false;
        }
      }
    }
    return true;
  }

  static randomGraph(numVertices, canvasWidth, canvasHeight) {
    let R = Math.min(canvasWidth, canvasHeight) / 3;
    let theta = 0;
    let x0 = canvasWidth / 2;
    let y0 = canvasHeight / 2;
    let flip = 0;

    let G = new Graph([], []);

    for (let i=0; i<numVertices; i++) {
      theta = 2 * Math.PI * i / numVertices - Math.PI / 2;
      G.addVertex(new Vertex(i, R * Math.cos(theta) + x0, R * Math.sin(theta) + y0));
    }

    for (let j=0; j<numVertices; j++) {
      for (let k=j+1; k<numVertices; k++) {
        flip = Math.random();
        if (flip > FLIP_PROBABILITY) {
          G.addEdge(new Edge(G.vertices[j], G.vertices[k]));
        }
      }
    }

    return G;
  }

  static completeGraph(numVertices, canvasWidth, canvasHeight) {
    let R = Math.min(canvasWidth, canvasHeight) / 3;
    let theta = 0;
    let x0 = canvasWidth / 2;
    let y0 = canvasHeight / 2;

    let G = new Graph([],[]);

    for (let i=0; i<numVertices; i++) {
      theta = 2 * Math.PI * i / numVertices - Math.PI / 2;
      G.addVertex(new Vertex(i, R * Math.cos(theta) + x0, R * Math.sin(theta) + y0));
    }

    for (let j=0; j<numVertices; j++) {
      for (let k=j+1; k<numVertices; k++) {
        G.addEdge(new Edge(G.vertices[j], G.vertices[k]));
      }
    }

    return G;
  }

  static completeBipartiteGraph(numVertices1, numVertices2, canvasWidth, canvasHeight) {
    var Gr = new Graph([], []);
    for (var i=0; i<numVertices1; i++) {
      Gr.addVertex(new Vertex(i + 1, (i + 1) * canvasWidth / (numVertices1 + 1), canvasHeight / 4));
    }

    for (var j=0; j<numVertices2; j++) {
      Gr.addVertex(new Vertex(-j - 1, (j + 1) * canvasWidth / (numVertices2 + 1), 3 * canvasHeight / 4));
    }

    for (var i=0; i<numVertices1; i++) {
      for (var j=0; j<numVertices2; j++) {
        Gr.addEdge(new Edge(Gr.vertices[i], Gr.vertices[numVertices1 + j]));
      }
    }

    return Gr;
  }

  static gridGraph(numRows, numCols, canvasWidth, canvasHeight) {
    var Gr = new Graph([], []);
    for (var i=0; i<numCols; i++) {
      for (var j=0; j<numRows; j++) {
        let v_id = i * numRows + j + 1;
        let v_x = (i + 1) * canvasWidth / (numCols + 1);
        let v_y = (j + 1) * canvasHeight / (numRows + 1);
        Gr.addVertex(new Vertex(v_id, v_x, v_y));
      }
    }

    for (var i=0; i<numCols; i++) {
      for (var j=0; j<numRows-1; j++) {
        Gr.addEdge(new Edge(Gr.getVertexByName(i * numRows + j + 1), Gr.getVertexByName(i * numRows + j + 2)));
      }
    }

    for (var j=0; j<numRows; j++) {
      for (var i=0; i<numCols-1; i++) {
        Gr.addEdge(new Edge(Gr.getVertexByName(i * numRows + j + 1), Gr.getVertexByName((i + 1) * numRows + j + 1)));
      }
    }

    return Gr;
  }

  static triangularGridGraph(numRows, numCols, canvasWidth, canvasHeight) {
    var Gr = new Graph([], []);
    for (var i=0; i<=numCols; i++) {
      for (var j=0; j<numRows; j++) {
        if ((i + j) % 2 == 1) {
          let v_id = i * numRows + j + 1;
          let v_x = (i + 1) * canvasWidth / (numCols + 2);
          let v_y = (j + 1) * canvasHeight / (numRows + 1);
          Gr.addVertex(new Vertex(v_id, v_x, v_y));
          //canvasUtil.println(`draw vertex ${v_id} at (${v_x}, ${v_y})`)
        }
      }
    }

    for (var i=0; i<=numCols; i++) {
      for (var j=0; j<numRows; j++) {
        if ((i + j) % 2 == 1) {
          if (j < numRows-2) {
            let v1_id = i * numRows + j + 1;
            let v2_id = i * numRows + j + 3;
            //canvasUtil.println(`trying to add a vertical edge between vertices ${v1_id} and ${v2_id}`);
            Gr.addEdge(new Edge(Gr.getVertexByName(v1_id), Gr.getVertexByName(v2_id)));
          }
          if (i<numCols) {
            let v1_id = i * numRows + j + 1;
            let v2_id = (i+1) * numRows + (j-1) + 1;
            //canvasUtil.println(`trying to add a up-right diagonal edge between vertices ${v1_id} and ${v2_id}`);
            Gr.addEdge(new Edge(Gr.getVertexByName(v1_id), Gr.getVertexByName(v2_id)));
          }
          if (i<numCols && j<numRows-1) {
            let v1_id = i * numRows + j + 1;
            let v2_id = (i+1) * numRows + (j+1) + 1;
            //canvasUtil.println(`trying to add a down-right diagonal edge between vertices ${v1_id} and ${v2_id}`);
            Gr.addEdge(new Edge(Gr.getVertexByName(v1_id), Gr.getVertexByName(v2_id)));
          }
        }
      }
    }

    return Gr;
  }
}


function pDistance(x, y, x1, y1, x2, y2) {
  // what does this function do?
  let A = x - x1;
  let B = y - y1;
  let C = x2 - x1;
  let D = y2 - y1;

  let dot = A * C + B * D;
  let lenSq = C * C + D * D;
  let t = dot / lenSq;

  let xx, yy;

  if (t < 0 || (x1 == x2 && y1 == y2)) {
    xx = x1;
    yy = y1;
  }
  else if (t > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + t * C;
    yy = y1 + t * D;
  }

  let dx = x - xx;
  let dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function printMatrix(m) {
  let s = "";
  for (let i=0; i<m.length; i++) {
    for (let j=0; j<m[0].length; j++) {
      s += " " + m[i][j];
    }
    s += '\n';
  }
  canvasUtil.println(s);
}

function equalMatrices(A, B) {
  for (let i=0; i<A.length; i++) {
    for (let j=0; j<A[i].length; j++) {
      if (A[i][j] != B[i][j]) {
        return false;
      }
    }
  }
  return true;
}

function permute(input) {
  let ch;
  for (let i = 0; i < input.length; i++) {
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

function linesIntersect(a, b, c, d, p, q, r, s) {
  // returns true iff the line (a,b)->(c,d) intersects the line (p,q)->(r,s)
  let det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  }
  else {
    let lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    let gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
}

function draw() {
  canvasUtil.clearCanvas();

  for (let i=0; i<g.vertices.length; i++) {
    if (g.vertices[i].hitTestVertex(mouseX, mouseY)) {
      g.vertices[i].halo = true;
    }
  }

  for (let j=0; j<g.edges.length; j++) {
    if (g.edges[j].hitTestEdge(mouseX, mouseY)) {
      g.edges[j].halo = true;
    }
  }

  g.draw();
  g.resetHalos();
}

function mouseMoveListener(ev) {
  const rect = canvas.getBoundingClientRect()
  mouseX = ev.clientX - rect.left
  mouseY = ev.clientY - rect.top
}


function mouseDragMoveListener(evt) {
  let posX = 0;
  let posY = 0;
  let shapeRad = RADIUS_DEFAULT;
  let minX = shapeRad;
  let maxX = canvas.width - shapeRad;
  let minY = shapeRad;
  let maxY = canvas.height - shapeRad;

  //getting mouse position correctly
  let bRect = canvas.getBoundingClientRect();
  mouseDragX = (evt.clientX - bRect.left) * (canvas.width / bRect.width);
  mouseDragY = (evt.clientY - bRect.top) * (canvas.height / bRect.height);

  //clamp x and y positions to prevent object from dragging outside of canvas
  posX = mouseDragX - dragHoldX;
  posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
  posY = mouseDragY - dragHoldY;
  posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);

  g.vertices[dragIndex].x = posX;
  g.vertices[dragIndex].y = posY
}

function mouseDownListener(evt) {
  //document.outform.output.value += "mousedown" + '\n';
  //let i;
  //We are going to pay attention to the layering order of the objects so
  //that if a mouse down occurs over more than object, only the topmost one
  //will be dragged.
  let highestIndex = -1;

  //getting mouse position correctly, being mindful of resizing that may
  //have occured in the browser:
  let bRect = canvas.getBoundingClientRect();
  mouseDragX = (evt.clientX - bRect.left) * (canvas.width / bRect.width);
  mouseDragY = (evt.clientY - bRect.top) * (canvas.height / bRect.height);

  //find which vertex was clicked
  for (let i=0; i < g.vertices.length; i++) {
    if (g.vertices[i].hitTestVertex(mouseX, mouseY)) {
      dragging = true;
      if (i > highestIndex) {
        //We will pay attention to the point on the object
        //where the mouse is "holding" the object:
        dragHoldX = mouseDragX - g.vertices[i].x;
        dragHoldY = mouseDragY - g.vertices[i].y;
        highestIndex = i;
        dragIndex = i;
      }
    }
  }

  if (dragging) {
    window.addEventListener("mousemove", mouseDragMoveListener, false);
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
    window.removeEventListener("mousemove", mouseDragMoveListener, false);
  }
}

function mouseDblclickListener(evt) {
  for (let i=0; i < g.vertices.length; i++) {
    if (g.vertices[i].hitTestVertex(mouseX, mouseY)) {
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

  for (let j=0; j < g.edges.length; j++) {
    if (g.edges[j].hitTestEdge(mouseX, mouseY)) {
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
  let msg = "  isomorphic to K5: " + (g.isIsomorphicToKn(5) ? "yes" : "no");
  canvasUtil.println(msg);
}

function isItK33() {
  let msg = "  isomorphic to K33: " + (g.isIsomorphicToK33() ? "yes" : "no");
  canvasUtil.println(msg);
}

function isPlanar() {
  let msg = "  planar drawing: " + (g.isPlanarDrawing() ? "yes" : "no");
  canvasUtil.println(msg);
}

function updateGraph(type, n, m) {
  n = parseInt(n);
  m = parseInt(m);

  if (type == "rand") {
    g = Graph.randomGraph(n, WIDTH, HEIGHT);
    canvasUtil.println(`drew random graph with ${n} vertices`);
  } else if (type == "comp") {
    g = Graph.completeGraph(n, WIDTH, HEIGHT);
    canvasUtil.println(`drew complete graph with ${n} vertices`);
  } else if (type == "bipt") {
    g = Graph.completeBipartiteGraph(n, m, WIDTH, HEIGHT);
    canvasUtil.println(`drew complete bipartite graph with ${n}, ${m} vertices`);
  } else if (type == "grid") {
    g = Graph.gridGraph(n, m, WIDTH, HEIGHT);
    canvasUtil.println(`drew grid graph with ${n} x ${m} vertices`);
  } else if (type == "tri_grid") {
    g = Graph.triangularGridGraph(n, m, WIDTH, HEIGHT);
    canvasUtil.println(`drew triangular grid graph with ${n} x ${m} vertices`);
  }
}

function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);

    // Attach the event handlers
    canvas.addEventListener('mousemove', mouseMoveListener, false);
    canvas.addEventListener("mousedown", mouseDownListener, false);
    window.addEventListener("mouseup", mouseUpListener, false);
    window.addEventListener("dblclick", mouseDblclickListener, false);

    updateGraph('rand', 7, 2);
    return setInterval(draw, 10);
  }
  else { alert('You need a better web browser to see this.'); }
}
