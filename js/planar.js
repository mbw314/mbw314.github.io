let WIDTH = 750;
let HEIGHT = 500;
let canvasUtil;
let mouseX;
let mouseY;
let dragHoldX;
let dragHoldY;
let mouseDragX;
let mouseDragY;

let g;
let dragging = false;
let draggedVertexName = -1;

let COLOR_DEFAULT = "#000000";
let COLOR_SELECTED = "#FF0000";
let COLOR_HALO = "#0000FF";
let RADIUS_DEFAULT = 10;
let RADIUS_HALO = 2;
let WIDTH_HALO = 4;
let THICKNESS_DEFAULT = 2;
let EDGE_CLICK = 5;


class InteractiveGraph extends Graph {
  constructor() {
    super();
    this.selectedVertex = -1;  // name of selected vertex
    this.selectedEdge = -1;  // index of selected edge
  }

  static makeGraphInteractive(og) {
    // set hover and selection statuses for vertices and edges
    let ig = new InteractiveGraph();
    ig._vertices = og._vertices;
    ig.edges = og.edges;
    ig.resetHalos();
    ig.resetSelected();
    return ig;
  }

  static randomGraph(numVertices, canvasWidth, canvasHeight) {
    return this.makeGraphInteractive(
      super.randomGraph(numVertices, canvasWidth, canvasHeight)
    );
  }

  static completeGraph(numVertices, canvasWidth, canvasHeight) {
    return this.makeGraphInteractive(
      super.completeGraph(numVertices, canvasWidth, canvasHeight)
    );
  }

  static completeBipartiteGraph(numVertices1, numVertices2, canvasWidth, canvasHeight) {
    return this.makeGraphInteractive(
      super.completeBipartiteGraph(numVertices1, numVertices2, canvasWidth, canvasHeight)
    );
  }

  static gridGraph(numCols, numRows, canvasWidth, canvasHeight) {
    return this.makeGraphInteractive(
      super.gridGraph(numCols, numRows, canvasWidth, canvasHeight)
    );
  }

  static triangularGridGraph(numCols, numRows, canvasWidth, canvasHeight) {
    return this.makeGraphInteractive(
      super.triangularGridGraph(numCols, numRows, canvasWidth, canvasHeight)
    );
  }

  static hexagonalGridGraph(numCols, numRows, canvasWidth, canvasHeight) {
    return this.makeGraphInteractive(
      super.hexagonalGridGraph(numCols, numRows, canvasWidth, canvasHeight)
    );
  }

  cursorHitsVertex(v, cursorX, cursorY) {
    let dx = v.x - cursorX;
    let dy = v.y - cursorY;
    return (dx * dx + dy * dy < RADIUS_DEFAULT * RADIUS_DEFAULT);
  }

  cursorHitsEdge(e, cursorX, cursorY) {
    //document.outform.output.value += "hit testing edge" + '\n';
    let x0 = this.v0(e).x;
    let y0 = this.v0(e).y;
    let x1 = this.v1(e).x;
    let y1 = this.v1(e).y;

    return (pDistance(cursorX, cursorY, x0, y0, x1, y1) < EDGE_CLICK &&
      !this.cursorHitsVertex(this.v0(e), cursorX, cursorY) &&
      !this.cursorHitsVertex(this.v1(e), cursorX, cursorY));
  }

  resetHalos() {
    this.vertices().forEach(v => v.data.halo = false);
    this.edges.forEach(e => e.data.halo = false);
  }

  resetSelected() {
    this.vertices().forEach(v => v.data.selected = false);
    this.edges.forEach(e => e.data.selected = false);
  }

  draw() {
    this.edges.forEach(e => {
      if (e.data.halo) {
        canvasUtil.drawLine(this.v0(e).x, this.v0(e).y, this.v1(e).x, this.v1(e).y, COLOR_HALO, WIDTH_HALO);
      }
      canvasUtil.drawLine(this.v0(e).x, this.v0(e).y, this.v1(e).x, this.v1(e).y, e.data.selected ? COLOR_SELECTED : COLOR_DEFAULT, THICKNESS_DEFAULT);
    });
    this.vertices().forEach(v => {
      if (v.data.halo) {
        canvasUtil.drawDisk(v.x, v.y, RADIUS_DEFAULT + RADIUS_HALO, COLOR_HALO);
      }
      canvasUtil.drawDisk(v.x, v.y, RADIUS_DEFAULT, v.data.selected ? COLOR_SELECTED : COLOR_DEFAULT);
    });
  }
}

function pDistance(x, y, x1, y1, x2, y2) {
  // distance from point to line segment
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

function draw() {
  canvasUtil.clearCanvas();

  g.vertices().forEach(v => {
    if (g.cursorHitsVertex(v, mouseX, mouseY)) {
      v.data.halo = true;
    }
  });

  g.edges.forEach(e => {
    if (g.cursorHitsEdge(e, mouseX, mouseY)) {
      e.data.halo = true;
    }
  });

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

  g.vertex(draggedVertexName).updatePosition(posX, posY);
}

function mouseDownListener(evt) {  
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
  g.vertexEntries().forEach(x => {
    let n = x[0];
    let v = x[1];
    if (g.cursorHitsVertex(v, mouseX, mouseY)) {
      dragging = true;
      if (n > highestIndex) {
        //We will pay attention to the point on the object
        //where the mouse is "holding" the object:
        dragHoldX = mouseDragX - v.x;
        dragHoldY = mouseDragY - v.y;
        highestIndex = n;
        draggedVertexName = n;
      }
    }
  });

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
  g.resetHalos();
  canvas.addEventListener("mousedown", mouseDownListener, false);
  window.removeEventListener("mouseup", mouseUpListener, false);
  if (dragging) {
    dragging = false;
    window.removeEventListener("mousemove", mouseDragMoveListener, false);
  }
}

function mouseDblclickListener(evt) {
  g.vertexEntries().forEach(x => {
    let n = x[0];
    let v = x[1];
    if (g.cursorHitsVertex(v, mouseX, mouseY)) {
      // deselect a selected vertex
      if (v.data.selected && g.selectedVertex != -1) {
        v.data.selected = false;
        g.selectedVertex = -1;
        console.log(`vertex ${n} deselected`);
      }
      // select an unselected vertex
      else if (!v.data.selected && g.selectedVertex == -1) {
        v.data.selected = true;
        g.selectedVertex = n;
        console.log(`vertex ${n} selected`);
      }
    }
  });

  [...g.edges.entries()].forEach(x => {
    let i = x[0];
    let e = x[1];
    if (g.cursorHitsEdge(e, mouseX, mouseY)) {
      // deselect a selected edge
      if (e.data.selected && g.selectedEdge != -1) {
        e.data.selected = false;
        g.selectedEdge = -1;
      }
      // select an unselected edge
      else if (!e.data.selected && g.selectedEdge == -1) {
        e.data.selected = true;
        g.selectedEdge = i;
      }
    }
  });
}

function reduce() {
  if (g.selectedVertex != -1) {
    if (g.seriesReduce(g.selectedVertex)) {
      g.selectedVertex = -1;
    }
  }
}

function deleteAVertex() {
  if (g.selectedVertex != -1) {
    g.deleteVertex(g.selectedVertex);
    g.selectedVertex = -1;
  }
}

function deleteAnEdge() {
  if (g.selectedEdge != -1) {
    g.deleteEdgeByIndex(g.selectedEdge);
    g.selectedEdge = -1;
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

  switch (type) {
    case "rand":
      g = InteractiveGraph.randomGraph(n, WIDTH, HEIGHT);
      canvasUtil.println(`drew random graph with ${n} vertices`);
      break;
    case "comp":
      g = InteractiveGraph.completeGraph(n, WIDTH, HEIGHT);
      canvasUtil.println(`drew complete graph with ${n} vertices`);
      break;
    case "bipt":
      g = InteractiveGraph.completeBipartiteGraph(n, m, WIDTH, HEIGHT);
      canvasUtil.println(`drew complete bipartite graph with ${n}, ${m} vertices`);
      break;
    case "grid":
      g = InteractiveGraph.gridGraph(m, n, WIDTH, HEIGHT);
      canvasUtil.println(`drew grid graph with ${n} x ${m} vertices`);
      break;
    case "tri_grid":
      g = InteractiveGraph.triangularGridGraph(m, n, WIDTH, HEIGHT);
      canvasUtil.println(`drew triangular grid graph with ${n} x ${m} vertices`);
      break;
    case "hex_grid":
      g = InteractiveGraph.hexagonalGridGraph(m, n, WIDTH, HEIGHT);
      canvasUtil.println(`drew hexagonal grid graph with ${n} x ${m} vertices`);
      break;
  }
}

function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("controls").clientWidth;
    console.log(WIDTH);
    if (WIDTH <= 750) {
      HEIGHT = 0.66 * WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.5 * document.getElementById("controls").clientHeight);
    }
    console.log(HEIGHT);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);

    // Attach the event handlers
    canvas.addEventListener('mousemove', mouseMoveListener, false);
    canvas.addEventListener("mousedown", mouseDownListener, false);
    window.addEventListener("mouseup", mouseUpListener, false);
    window.addEventListener("dblclick", mouseDblclickListener, false);

    updateGraph('rand', 7, 2);
    return setInterval(draw, 100);
  }
  else { alert('You need a better web browser to see this.'); }
}
