let FLIP_PROBABILITY = 0.35;
let EPSILON = 0.01;
let permArr = [], usedChars = [];

class Vertex {
  constructor(x ,y) {
    this.x = x;
    this.y = y;
    this.data = {};  // other info can be added here
    this.neighbors = []; // a list names of neighboring vertices
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  hasSamePosition(v) {
    // TODO: needed?
    return Math.abs(this.x - v.x) < EPSILON && Math.abs(this.y - v.y) < EPSILON;
  }

  degree() {
    return this.neighbors.length;
  }

  addNeighbor(n) {
    this.neighbors.push(n);
  }

  deleteNeighbor(n) {
    this.neighbors = this.neighbors.filter(nbr => nbr != n);
  }

  toString() {
    return `vertex (${this.x.toFixed(1)}, ${this.y.toFixed(1)}); ${this.neighbors.toString()}`;
  }
}


class Edge {
  // simple edge object: only has the names of the vertices
  constructor(n0, n1) {
    this.n0 = n0; // name of initial vertex
    this.n1 = n1; // name of terminal vertex
    this.data = {};
  }

  toString() {
    return `edge ${this.n0} -> ${this.n1}`;
  }

  hasVertex(n) {
    return this.n0 == n || this.n1 == n;
  }
}

class Graph {
  constructor() {
    // always start with empty graph and incrementally build it using addVertex, addEdge
    this._vertices = new Map();  // Map object of name -> Vertex obj
    this.edges = new Array(); // new Set();  // Set of Edge objs (how to handle object equality/comparison in sets?)
  }

  vertex(n) {
    return this._vertices.get(n);
  }

  numVertices() {
    return this._vertices.size;
  }

  vertices() {
    return [...this._vertices.values()];
  }

  vertexNames() {
    return [...this._vertices.keys()];
  }

  vertexEntries() {
    return [...this._vertices.entries()];
  }

  numEdges() {
    return this.edges.length;
  }

  toString() {
    return `graph with ${this.numVertices()} vertices ${this.vertexNames()} and ${this.numEdges()} edges`;
  }

  neighborsString() {
    return this.vertexEntries().map(v => `vertex ${v[0]} --> ${v[1].neighbors}`).join('\n');
  }

  draw() {
    this.edges.forEach(e => {
      canvasUtil.drawLine(this.v0(e).x, this.v0(e).y, this.v1(e).x, this.v1(e).y, COLOR_DEFAULT, THICKNESS_DEFAULT);
    });
    this.vertices().forEach(v => {
      canvasUtil.drawDisk(v.x, v.y, RADIUS_DEFAULT, COLOR_DEFAULT);
    });
  }

  v0(e) {
    return this.vertex(e.n0);
  }

  v1(e) {
    return this.vertex(e.n1);
  }

  addVertex(name, v) {
    this._vertices.set(name, v);
  }

  addEdge(n0, n1) {
    // only add a new edge if it is unique. put the lesser name first.
    let minN = Math.min(n0, n1);
    let maxN = Math.max(n0, n1);
    if (!this.edges.map(e => [e.n0, e.n1]).includes([minN, maxN])) {
      this.edges.push(new Edge(minN, maxN));
      this.vertex(minN).neighbors.push(maxN);
      this.vertex(maxN).neighbors.push(minN);
      // console.log(`added edge ${this.edges[this.edges.length - 1].toString()}`);
    } else {
      // console.log(`could not add edge because it is already in the graph`);
    }
  }

  getNameToRowMap() {
    return new Map([...this.vertexNames().entries()].map(x => [x[1], x[0]]));
  }

  getRowToNameMap() {
    return new Map([...this.vertexNames().entries()].map(x => [x[0], x[1]]));
  }

  getAdjacencyMatrix() {
    let nameToRow = this.getNameToRowMap();
    let rowToName = this.getRowToNameMap();
    let matrix = [];
    for (let i=0; i<this.numVertices(); i++) {
      matrix[i] = new Array(this.numVertices()).fill(0);
    }
    [...rowToName.entries()].forEach(r => this.vertex(r[1]).neighbors.forEach(n => matrix[r[0]][nameToRow.get(n)] = 1));
    return matrix;
  }

  vertexHas2ConnectedNeighbors(v) {
    // vertex has exactly two neighbors and they are connected
    if (v.degree() == 2) {
      // is neighbor 0 in the list of neighbors of neighbor 1?
      let n0 = v.neighbors[0];
      let v1 = this.vertex(v.neighbors[1]);
      return v1.neighbors.includes(n0);
    }
    else return false;
  }

  vertexIsInTriangle(v) {
    if (v.degree() >= 2) {
      let nbrPairs = pairs(v.neighbors);
      for (let i=0; i<nbrPairs.length; i++) {
        let nbrs0 = this.vertex(nbrPairs[i][0]).neighbors;
        let nbrs1 = this.vertex(nbrPairs[i][1]).neighbors;
        if (nbrs0.includes(nbrPairs[i][1]) && nbrs1.includes(nbrPairs[i][0])) {
          return true;
        }
      }
    }
    return false;
  }

  deleteVertex(n) {
    this._vertices.delete(n);
    this.vertices().forEach(v => v.deleteNeighbor(n));
    this.edges = this.edges.filter(e => !e.hasVertex(n));
  }

  deleteEdgeByIndex(i) {
    this.vertex(this.edges[i].n0).deleteNeighbor(this.edges[i].n1);
    this.vertex(this.edges[i].n1).deleteNeighbor(this.edges[i].n0);
    this.edges.splice(i, 1);
  }

  seriesReduce(n) {  // name of vertex
    if (this.vertex(n).degree() == 2 && !this.vertexHas2ConnectedNeighbors(this.vertex(n))) {
      let nbrs = this.vertex(n).neighbors;
      this.deleteVertex(n);
      this.addEdge(nbrs[0], nbrs[1]);
      return true;
    } else {
      return false;
    }
  }

  isIsomorphicToKn(n) {
    if (this.numVertices() == n) {
      let degrees = new Set(this.vertices().map(v => v.degree()));
      if (degrees.size == 1 && degrees.has(n-1)) {
        return true;
      }
    }
    return false;
  }

  isIsomorphicToK33() {
    /*
      There are only 2 non-isomorphic 3-regular graphs with 6 vertices:
      - k33
      - "triangular cylinder", e.g., join 2 triangles a-b-c, a'-b'-c' with edges aa', bb', cc'
      So to check if a graph is isomorphic to k33, it is enough to check that:
      - it has 6 vertices (and 9 edges)
      - it is 3-regular (so it must be among the two graphs above)
      - it DOES NOT contain a triangle
    */

    if (this.numVertices() == 6 && this.edges.length == 9) {
      let degrees = new Set(this.vertices().map(v => v.degree()));
      if (degrees.size == 1 && degrees.has(3)) {
        let withTriangles = this.vertices().filter(v => this.vertexIsInTriangle(v));
        if (withTriangles.length == 0) {
          return true;
        }
      }
    }
    return false;
  }

  isPlanarDrawing() {
    //check that no two edges intersect
    for (let i=0; i<this.edges.length; i++) {
      for (let j=i+1; j<this.edges.length; j++) {
        if (linesIntersect(
            this.vertex(g.edges[i].n0).x, this.vertex(g.edges[i].n0).y,
            this.vertex(g.edges[i].n1).x, this.vertex(g.edges[i].n1).y,
            this.vertex(g.edges[j].n0).x, this.vertex(g.edges[j].n0).y,
            this.vertex(g.edges[j].n1).x, this.vertex(g.edges[j].n1).y)) {
          return false;
        }
      }
    }
    return true;
  }

  static randomGraph(numVertices, canvasWidth, canvasHeight) {
    let r = Math.min(canvasWidth, canvasHeight) / 3;
    let theta = 0;
    let x0 = canvasWidth / 2;
    let y0 = canvasHeight / 2;
    let flip = 0;

    let g = new Graph();

    for (let i=0; i<numVertices; i++) {
      theta = 2 * Math.PI * i / numVertices - Math.PI / 2;
      g.addVertex(i, new Vertex(r * Math.cos(theta) + x0, r * Math.sin(theta) + y0));
    }

    for (let j=0; j<numVertices; j++) {
      for (let k=j+1; k<numVertices; k++) {
        flip = Math.random();
        if (flip > FLIP_PROBABILITY) {
          g.addEdge(j, k);
        }
      }
    }

    return g;
  }

  static completeGraph(numVertices, canvasWidth, canvasHeight) {
    let r = Math.min(canvasWidth, canvasHeight) / 3;
    let theta = 0;
    let x0 = canvasWidth / 2;
    let y0 = canvasHeight / 2;

    let g = new Graph();

    for (let i=0; i<numVertices; i++) {
      theta = 2 * Math.PI * i / numVertices - Math.PI / 2;
      g.addVertex(i, new Vertex(r * Math.cos(theta) + x0, r * Math.sin(theta) + y0));
    }

    for (let j=0; j<numVertices; j++) {
      for (let k=j+1; k<numVertices; k++) {
        g.addEdge(j, k);
      }
    }

    return g;
  }

  static completeBipartiteGraph(numVertices1, numVertices2, canvasWidth, canvasHeight) {
    let g = new Graph();
    for (let i=0; i<numVertices1; i++) {
      g.addVertex(i, new Vertex((i + 1) * canvasWidth / (numVertices1 + 1), canvasHeight / 4));
    }

    for (let j=0; j<numVertices2; j++) {
      g.addVertex(numVertices1 + j, new Vertex((j + 1) * canvasWidth / (numVertices2 + 1), 3 * canvasHeight / 4));
    }

    for (let i=0; i<numVertices1; i++) {
      for (let j=0; j<numVertices2; j++) {
        g.addEdge(i, numVertices1 + j);
      }
    }

    return g;
  }

  static gridGraph(numCols, numRows, canvasWidth, canvasHeight) {
    function getName(i, j) {
      return i * numRows + j + 1;
    }

    // quantities needed to ensure proper proportions and center the grid on the canvas
    let sep = Math.min(canvasWidth / (numCols + 1), canvasHeight / (numRows + 1));
    let xMax = (numCols - 1) * sep;
    let yMax = (numRows - 1) * sep;
    let x0 = (canvasWidth - xMax) / 2;
    let y0 = (canvasHeight - yMax) / 2;

    let g = new Graph();
    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        let name = i * numRows + j + 1;
        let x = i * sep + x0;
        let y = j * sep + y0;
        g.addVertex(name, new Vertex(x, y));
      }
    }

    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows-1; j++) {
        let name1 = getName(i, j);
        let name2 = getName(i, j + 1);
        g.addEdge(name1, name2);
      }
    }

    for (let j=0; j<numRows; j++) {
      for (let i=0; i<numCols-1; i++) {
        let name1 = getName(i, j);
        let name2 = getName(i + 1, j);
        g.addEdge(name1, name2);
      }
    }

    return g;
  }

  static triangularGridGraph(numCols, numRows, canvasWidth, canvasHeight) {
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

    let g = new Graph();
    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          let name = getName(i, j);
          let x = phi * i * sep + x0;
          let y = j * sep + y0;
          g.addVertex(name, new Vertex(x, y));
        }
      }
    }

    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          if (i < numCols-2) {
            let name1 = getName(i, j);
            let name2 = getName(i + 2, j);
            g.addEdge(name1, name2);
          }
          if (i>0 && j<numRows-1) {
            let name1 = getName(i, j);
            let name2 = getName(i - 1, j + 1);
            g.addEdge(name1, name2);
          }
          if (i<numCols-1 && j<numRows-1) {
            let name1 = getName(i, j);
            let name2 = getName(i + 1, j + 1);
            g.addEdge(name1, name2);
          }
        }
      }
    }

    return g;
  }

  static hexagonalGridGraph(numCols, numRows, canvasWidth, canvasHeight) {
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

    let g = new Graph();
    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          let name = getName(i, j);
          let x = phi * i * sep + x0;
          let y = j * sep + y0;
          g.addVertex(name, new Vertex(x, y));
        }
      }
    }

    for (let i=0; i<numCols; i++) {
      for (let j=0; j<numRows; j++) {
        if (isValidVertex(i, j)) {
          if ((i%6==1 && j%2==0 && i+2<numCols) || (i%6==4 && j%2==1 && i+2<numCols)) {
            let name1 = getName(i, j);
            let name2 = getName(i + 2, j);
            g.addEdge(name1, name2);
          }
          if ((i%6==0 && j%2==1 && i+1<numCols && j>0) || (i%6==3 && j%2==0 && i+1<numCols && j>0)) {
            let name1 = getName(i, j);
            let name2 = getName(i + 1, j - 1);
            g.addEdge(name1, name2);
          }
          if ((i%6==3 && j%2==0 && i+1<numCols && j+1<numRows) || (i%6==0 && j%2==1 && i+1<numCols && j+1<numRows)) {
            let name1 = getName(i, j);
            let name2 = getName(i + 1, j + 1);
            g.addEdge(name1, name2);
          }
        }
      }
    }

    return g;
  }
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

function pairs(xs) {
  // assume elements of xs are distinct
  let result = [];
  for (let i=0; i<xs.length; i++) {
    for (let j=i+1; j<xs.length; j++) {
      result.push([xs[i], xs[j]]);
    }
  }
  return result;
}

function intersection(setA, setB) {
  let _intersection = new Set();
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}
