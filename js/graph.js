// let COLOR_DEFAULT = "#000000";
// let COLOR_SELECTED = "#FF0000";
// let COLOR_HALO = "#0000FF";
// let RADIUS_DEFAULT = 10;
// let RADIUS_HALO = 2;
// let WIDTH_HALO = 4;
// let THICKNESS_DEFAULT = 2;
// let EDGE_CLICK = 5;

let FLIP_PROBABILITY = 0.35;
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

  degree() {
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

  toString() {
    return `graph with ${this.vertices.length} vertices ${this.vertices.map(v=>v.name)} and ${this.edges.length} edges`;
  }

  neighborsString() {
    return this.vertices.map(v => `vertex ${v.name} --> ${v.neighbors}`).join('\n');
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
    if (v.degree() == 2) {
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
    v.neighbors.forEach(name => this.deleteEdgeByVertexNames(v.name, name));

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

    if (this.vertices[i].degree() == 2 &&
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
    let Gr = new Graph([], []);
    for (let i=0; i<numVertices1; i++) {
      Gr.addVertex(new Vertex(i + 1, (i + 1) * canvasWidth / (numVertices1 + 1), canvasHeight / 4));
    }

    for (let j=0; j<numVertices2; j++) {
      Gr.addVertex(new Vertex(-j - 1, (j + 1) * canvasWidth / (numVertices2 + 1), 3 * canvasHeight / 4));
    }

    for (let i=0; i<numVertices1; i++) {
      for (let j=0; j<numVertices2; j++) {
        Gr.addEdge(new Edge(Gr.vertices[i], Gr.vertices[numVertices1 + j]));
      }
    }

    return Gr;
  }

  static gridGraph(numRows, numCols, canvasWidth, canvasHeight) {
    let Gr = new Graph([], []);
    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        let name = i * numRows + j + 1;
        let x = (i + 1) * canvasWidth / (numCols + 1);
        let y = (j + 1) * canvasHeight / (numRows + 1);
        Gr.addVertex(new Vertex(name, x, y));
      }
    }

    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows-1; j++) {
        Gr.addEdge(new Edge(Gr.getVertexByName(i * numRows + j + 1), Gr.getVertexByName(i * numRows + j + 2)));
      }
    }

    for (let j=0; j<numRows; j++) {
      for (let i=0; i<numCols-1; i++) {
        Gr.addEdge(new Edge(Gr.getVertexByName(i * numRows + j + 1), Gr.getVertexByName((i + 1) * numRows + j + 1)));
      }
    }

    return Gr;
  }

  static triangularGridGraph(numRows, numCols, canvasWidth, canvasHeight) {
    function isValidVertex(i, j) {
      return (i + j) % 2 == 1;
    }

    function getName(i, j) {
      return i * numRows + j + 1;
    }

    // quantities needed to ensure proper proportions and center the grid on the canvas
    let phi = 1 / Math.sqrt(3); // equilateral factor
    let sep = Math.min(canvasWidth / (phi * numCols + 1), canvasHeight / (numRows + 1));
    let xMax = phi * (numCols - 1) * sep;
    let yMax = (numRows - 1) * sep;
    let x0 = (canvasWidth - xMax) / 2;
    let y0 = (canvasHeight - yMax) / 2;

    let Gr = new Graph([], []);
    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          let name = getName(i, j);
          let x = phi * i * sep + x0;
          let y = j * sep + y0;
          Gr.addVertex(new Vertex(name, x, y));
        }
      }
    }

    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          if (i < numCols-2) {
            let name1 = getName(i, j);
            let name2 = getName(i + 2, j);
            Gr.addEdge(new Edge(Gr.getVertexByName(name1), Gr.getVertexByName(name2)));
          }
          if (i>0 && j<numRows-1) {
            let name1 = getName(i, j);
            let name2 = getName(i - 1, j + 1);
            Gr.addEdge(new Edge(Gr.getVertexByName(name1), Gr.getVertexByName(name2)));
          }
          if (i<numCols-1 && j<numRows-1) {
            let name1 = getName(i, j);
            let name2 = getName(i + 1, j + 1);
            Gr.addEdge(new Edge(Gr.getVertexByName(name1), Gr.getVertexByName(name2)));
          }
        }
      }
    }

    return Gr;
  }

  static hexagonalGridGraph(numRows, numCols, canvasWidth, canvasHeight) {
    function isValidVertex(i, j) {
      if (j%2==0) {
        return i%6==1 || i%6==3;
      } else {
         return i%6==0 || i%6==4;
      }
    }

    function getName(i, j) {
      return i * numRows + j + 1;
    }

    // quantities needed to ensure proper proportions and center the grid on the canvas
    let phi = 1 / Math.sqrt(3);
    let sep = Math.min(canvasWidth / (phi * numCols + 1), canvasHeight / (numRows + 1));
    let xMax = phi * (numCols - 1) * sep;
    let yMax = (numRows - 1) * sep;
    let x0 = (canvasWidth - xMax) / 2;
    let y0 = (canvasHeight - yMax) / 2;

    let Gr = new Graph([], []);
    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          let name = getName(i, j);
          let x = phi * i * sep + x0;
          let y = j * sep + y0;
          Gr.addVertex(new Vertex(name, x, y));
        }
      }
    }

    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          if ((i%6==1 && j%2==0 && i+2<numCols) || (i%6==4 && j%2==1 && i+2<numCols)) {
            let name1 = getName(i, j);
            let name2 = getName(i + 2, j);
            Gr.addEdge(new Edge(Gr.getVertexByName(name1), Gr.getVertexByName(name2)));
          }
          if ((i%6==0 && j%2==1 && i+1<numCols && j>0) || (i%6==3 && j%2==0 && i+1<numCols && j>0)) {
            let name1 = getName(i, j);
            let name2 = getName(i + 1, j - 1);
            Gr.addEdge(new Edge(Gr.getVertexByName(name1), Gr.getVertexByName(name2)));
          }
          if ((i%6==3 && j%2==0 && i+1<numCols && j+1<numRows) || (i%6==0 && j%2==1 && i+1<numCols && j+1<numRows)) {
            let name1 = getName(i, j);
            let name2 = getName(i + 1, j + 1);
            Gr.addEdge(new Edge(Gr.getVertexByName(name1), Gr.getVertexByName(name2)));
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
