var ctx;
var canvas;
var WIDTH = 750;
var HEIGHT = 750;
let paused = true;
let ca; // cellular automaton object
var gridHeight;
var magnification;
var colorMatrix;

var oldTimeStamp = 0;

const magnifications = {
  '1x': 1,
  '2x': 2,
  '3x': 3,
  '5x': 5,
  '10x': 10,
};

const firstRowsStyles = {
  "RANDOM": "RANDOM",
  "CENTERED": "CENTERED"
}

const cellConfigs = {
  "TWO_ABOVE": [
    (i, j) => [i - 1, j],
    (i, j) => [i - 1, j + 1],
  ],
  "THREE_ABOVE": [
    (i, j) => [i - 1, j - 1],
    (i, j) => [i - 1, j],
    (i, j) => [i - 1, j + 1],
  ],
  "FIVE_ABOVE": [
    (i, j) => [i - 1, j - 2],
    (i, j) => [i - 1, j - 1],
    (i, j) => [i - 1, j],
    (i, j) => [i - 1, j - 1],
    (i, j) => [i - 1, j - 2],
  ],
  "THREE_AND_ONE_ABOVE": [
    (i, j) => [i - 1, j - 1],
    (i, j) => [i - 1, j],
    (i, j) => [i - 1, j + 1],
    (i, j) => [i - 2, j],
  ],
  "THREE_AND_THREE_ABOVE": [
    (i, j) => [i - 1, j - 1],
    (i, j) => [i - 1, j],
    (i, j) => [i - 1, j + 1],
    (i, j) => [i - 2, j - 1],
    (i, j) => [i - 2, j],
    (i, j) => [i - 2, j + 1],
  ]
}

const cellConfigRowNums = {
  "TWO_ABOVE": 1,
  "THREE_ABOVE": 1,
  "FIVE_ABOVE": 1,
  "THREE_AND_ONE_ABOVE": 2,
  "THREE_AND_THREE_ABOVE": 2
}

const colors = ['black', 'white', 'red', 'blue', 'green', 'purple'];

function range(n) {
  return [...Array(n).keys()];
}

Number.prototype.mod = function(n) {
    return ((this % n) +n ) % n;
};


class AbstractAutomatonRule {
  // enumeration of mapping from a tuple of numInputs states to one state
  // a mappings is stored as an array of states, indexed by the base-numStates values of the inputs
  constructor(numStates, numInputs) {
    this.numStates = numStates;
    this.numInputs = numInputs;
    this.rule = this.randomRule();
  }

  randomRule() {
    return range(Math.pow(this.numStates, this.numInputs))
      .map(k => Math.round(Math.random() * this.numStates + 1) % this.numStates);
  }

  evaluate(inputs) {
    // inputs: array of states of length numInputs
    // treat inputs elements as digits of base-numStates number, which maps to index of rule
    let index = range(inputs.length)
      .map(i => inputs[i] * Math.pow(this.numStates, i))
      .reduce((a, b) => a + b, 0);
    return this.rule[index];
  }
}


class ColorMatrix {
  // represents an image that can be drawn on the canvas
  constructor(matrix, colors) {
    this.matrix = matrix; // double array of integers (=indices of colors array)
    this.colors = colors; // array of color strings
    this.numRows = matrix.length;
    this.numCols = matrix[0].length;
    //canvasUtil.println(`created new ColorMatrix with size ${this.numRows} x ${this.numCols} and ${this.colors.length} colors`);
  }

  draw(mag) {
    //canvasUtil.println(`filling color matrix of size ${this.numRows} x ${this.numCols} at magnification ${mag}x`);
    for (let i=0; i < this.numRows; i++) {
      for (let j=0; j < this.numCols; j++) {
        canvasUtil.drawRect(mag * j, mag * i, mag, mag, this.colors[this.matrix[i][j]]);
      }
    }
  }
}


class CellularAutomaton {
  // encapsulates data needed to store visualize a cellular automaton
  constructor(states, width, numInitialRows, cellMappings) {
    this.states = states; // array of states e.g., colors
    this.numStates = this.states.length;
    this.width = width;
    this.cellMappings = cellMappings; // array of functions (i, j) -> f(i, j) that indicate which cells to use as input for the automata rule
    this.automata = new AbstractAutomatonRule(states.length, cellMappings.length);
    this.numInitialRows = numInitialRows;
    this.currentRows; // matrix of states (indexes of states array) for rows needed to apply the automata rule
  }

  initialize(style) {
    //canvasUtil.println(`initialing ${this.numInitialRows} row(s) with ${this.width} columns`);//; currently have ${this.currentRows.length} rows`);
    let rows = [];
    if (style == firstRowsStyles.RANDOM) {
      for (let r=0; r < this.numInitialRows; r++) {
        //this.currentRows[r]
        let row = range(this.width)
          .map(k => Math.round(Math.random() * this.numStates + 1) % this.numStates);
        rows.push(row);
        //canvasUtil.println(`made this new row: ${row}`);
      }
    } else if (style == firstRowsStyles.CENTERED) {
      let row = range(this.width).map(k => 0);
      row[Math.round(this.width / 2)] = 1;
      for (let r=0; r < this.numInitialRows; r++) {
        rows.push(row);
        //canvasUtil.println(`made this new row: ${row}`);
      }
    }
    this.currentRows = rows;
  }

  getNewRow() {
    // apply the automata rule to the current rows of the grid, obtaining a new row
    let i = this.currentRows.length;
    let row = [];
    for (let j=0; j < this.width; j++) {
      let inputs =  this.cellMappings
        .map(f => f(i, j))
        .map(indices => this.currentRows[indices[0].mod(this.width)][indices[1].mod(this.width)]);
      //console.log(inputs);
      let newState = this.automata.evaluate(inputs);
      row.push(newState);
    }
    return row;
  }

  iterate() {
    // get a new row and update the current rows of the grid
    let newRow = this.getNewRow();
    if (this.numInitialRows == 1) {
      this.currentRows = [newRow];
    } else {
      let temp = this.currentRows.shift();
      this.currentRows = this.currentRows.concat([newRow]);
    }
    return newRow;
  }

  fillColorMatrix(numRows) {
    // produce full ColorMatrix from the current system
    let t0 =(new Date()).getTime();
    let rows = this.currentRows;
    for (let i=this.currentRows.length; i < numRows; i++) {
      rows.push(this.iterate());
    }
    let t1 =(new Date()).getTime();
    //canvasUtil.println(`generated color matrix in ${t1 - t0} milliseconds`);
    colorMatrix = new ColorMatrix(rows, this.states);
  }

  iterateColorMatrix() {
    // perform an iteration on the existing ColorMatrix
    let t0 =(new Date()).getTime();
    let newRow = this.iterate();
    let temp = colorMatrix.matrix.shift();
    colorMatrix.matrix = colorMatrix.matrix.concat([newRow]);
    let t1 =(new Date()).getTime();
    //canvasUtil.println(`generated color matrix in ${t1 - t0} milliseconds`);
  }
}


function drawNew(numColors, cellConfigKey, initialRowsStyle, magKey) {
  // create a new automaton with given parameters, and draw it
  canvasUtil.clearCanvas();
  magnification = magnifications[magKey];
  let gridWidth = WIDTH / magnification;
  gridHeight = HEIGHT / magnification;
  let numInitialRows = cellConfigRowNums[cellConfigKey];
  let cellConfig = cellConfigs[cellConfigKey];
  //canvasUtil.println(`drawNew with numColors = ${numColors}; cellConfig = ${cellConfig}; initialRowsStyle = ${initialRowsStyle}; numInitialRows = ${numInitialRows}; magnification = ${magnification}; gridWidth = ${gridWidth}; gridHeight = ${gridHeight}`);
  ca = new CellularAutomaton(colors.slice(0, numColors), gridWidth, numInitialRows, cellConfig);
  ca.initialize(initialRowsStyle);
  ca.fillColorMatrix(gridHeight);
  colorMatrix.draw(magnification);
}


function refresh(initialRowsStyle, magKey) {
  // keep the current automaton rule, but update some image parameters, and draw it
  canvasUtil.clearCanvas();
  magnification = magnifications[magKey];
  let gridWidth = WIDTH / magnification;
  gridHeight = HEIGHT / magnification;
  //canvasUtil.println(`refresh with initialRowsStyle = ${initialRowsStyle}; cellConfig = ${cellConfig}; magnification = ${magnification}; gridWidth = ${gridWidth}; gridHeight = ${gridHeight}`);
  ca.width = gridWidth;
  ca.initialize(initialRowsStyle);
  ca.fillColorMatrix(gridHeight);
  colorMatrix.draw(magnification);
}


function pauseDrawing() {
  paused = !paused;
  if (!paused) {
    requestAnimationFrame(draw);
  }
}


function draw() {
  if (paused) {
    return 0;
  }
  canvasUtil.clearCanvas();
  ca.iterateColorMatrix();
  colorMatrix.draw(magnification);
}


function init() {
  canvas = document.getElementById("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext){
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    canvasUtil.clearCanvas();
    return setInterval(draw, 50);
  } else {
    alert('You need a better web browser to see this.');
  }
}
