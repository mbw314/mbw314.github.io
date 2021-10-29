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
let dragIndex = 0;

let COLOR_DEFAULT = "#000000";
let COLOR_SELECTED = "#FF0000";
let COLOR_HALO = "#0000FF";
let RADIUS_DEFAULT = 10;
let RADIUS_HALO = 2;
let WIDTH_HALO = 4;
let THICKNESS_DEFAULT = 2;
let EDGE_CLICK = 5;

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

  switch (type) {
    case "rand":
      g = Graph.randomGraph(n, WIDTH, HEIGHT);
      canvasUtil.println(`drew random graph with ${n} vertices`);
      break;
    case "comp":
      g = Graph.completeGraph(n, WIDTH, HEIGHT);
      canvasUtil.println(`drew complete graph with ${n} vertices`);
      break;
    case "bipt":
      g = Graph.completeBipartiteGraph(n, m, WIDTH, HEIGHT);
      canvasUtil.println(`drew complete bipartite graph with ${n}, ${m} vertices`);
      break;
    case "grid":
      g = Graph.gridGraph(m, n, WIDTH, HEIGHT);
      canvasUtil.println(`drew grid graph with ${n} x ${m} vertices`);
      break;
    case "tri_grid":
      g = Graph.triangularGridGraph(m, n, WIDTH, HEIGHT);
      canvasUtil.println(`drew triangular grid graph with ${n} x ${m} vertices`);
      break;
    case "hex_grid":
      g = Graph.hexagonalGridGraph(m, n, WIDTH, HEIGHT);
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
    return setInterval(draw, 10);
  }
  else { alert('You need a better web browser to see this.'); }
}
