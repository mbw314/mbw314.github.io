let canvasUtil;
let WIDTH = 750;
let HEIGHT = 750;
let paused = true;
let ca; // cellular automaton object
let gridHeight;
let magnification;
let colors;
let colorMatrix;

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

// for a given cell configuration, specify which cells--relative to (i, j)--are needed to determine a rule
const cellConfigs = {
  "TWO_ABOVE": (i, j) => [
      [i - 1, j],
      [i - 1, j + 1],
  ],
  "THREE_ABOVE": (i, j) => [
    [i - 1, j - 1],
    [i - 1, j],
    [i - 1, j + 1],
  ],
  "FIVE_ABOVE": (i, j) => [
    [i - 1, j - 2],
    [i - 1, j - 1],
    [i - 1, j],
    [i - 1, j - 1],
    [i - 1, j - 2],
  ],
  "THREE_AND_ONE_ABOVE": (i, j) => [
    [i - 1, j - 1],
    [i - 1, j],
    [i - 1, j + 1],
    [i - 2, j],
  ],
  "THREE_AND_THREE_ABOVE": (i, j) => [
    [i - 1, j - 1],
    [i - 1, j],
    [i - 1, j + 1],
    [i - 2, j - 1],
    [i - 2, j],
    [i - 2, j + 1],
  ]
}

const cellConfigRowNums = {
  "TWO_ABOVE": 1,
  "THREE_ABOVE": 1,
  "FIVE_ABOVE": 1,
  "THREE_AND_ONE_ABOVE": 2,
  "THREE_AND_THREE_ABOVE": 2
}

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
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
      .map(k => Math.floor(Math.random() * this.numStates) % this.numStates);
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
    this.colors = colors; // array of Color objects
    this.numRows = matrix.length;
    this.numCols = matrix[0].length;
    //canvasUtil.println(`created new ColorMatrix with size ${this.numRows} x ${this.numCols} and ${this.colors.length} colors`);
  }

  draw(mag) {
    //canvasUtil.println(`filling color matrix of size ${this.numRows} x ${this.numCols} at magnification ${mag}x`);
    let imageData = canvasUtil.ctx.createImageData(WIDTH, HEIGHT);
    for (let i=0; i < this.numRows; i++) {
      for (let j=0; j < this.numCols; j++) {
        let color = this.colors[this.matrix[i][j]];
        for (let mi=0; mi<mag; mi++) {
          for (let mj=0; mj<mag; mj++) {
            let pixelIndex = ((i * mag + mi) * WIDTH + (j * mag + mj)) * 4;
            imageData.data[pixelIndex] = color.r;
            imageData.data[pixelIndex+1] = color.g;
            imageData.data[pixelIndex+2] = color.b;
            imageData.data[pixelIndex+3] = 255; // Alpha
          }
        }
      }
    }
    canvasUtil.ctx.putImageData(imageData, 0, 0);
  }
}


class CellularAutomaton {
  // encapsulates data needed to visualize a cellular automaton
  constructor(states, width, numInitialRows, cellMappings) {
    this.states = states; // array of states e.g., colors
    this.numStates = this.states.length;
    this.width = width;
    this.cellMappings = cellMappings; // function (i, j) -> Array of f(i, j) that indicate which cells to use as input for the automata rule
    this.automata = new AbstractAutomatonRule(states.length, cellMappings(0, 0).length);
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
          .map(k => Math.floor(Math.random() * this.numStates) % this.numStates);
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
      let inputs =  this.cellMappings(i, j)
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
    let rows = this.currentRows;
    for (let i=this.currentRows.length; i < numRows; i++) {
      rows.push(this.iterate());
    }
    colorMatrix = new ColorMatrix(rows, this.states);
  }

  iterateColorMatrix() {
    // perform an iteration on the existing ColorMatrix
    let newRow = this.iterate();
    let temp = colorMatrix.matrix.shift();
    colorMatrix.matrix = colorMatrix.matrix.concat([newRow]);
  }
}


function drawNew(numColors, cellConfigKey, initialRowsStyle, magKey) {
  // create a new automaton with given parameters, and draw it
  canvasUtil.clearCanvas();
  magnification = magnifications[magKey];
  let gridWidth = parseInt(WIDTH / magnification);
  gridHeight = parseInt(HEIGHT / magnification);
  let numInitialRows = cellConfigRowNums[cellConfigKey];
  let cellConfig = cellConfigs[cellConfigKey];
  //canvasUtil.println(`drawNew with numColors = ${numColors}; cellConfig = ${cellConfig}; initialRowsStyle = ${initialRowsStyle}; numInitialRows = ${numInitialRows}; magnification = ${magnification}; gridWidth = ${gridWidth}; gridHeight = ${gridHeight}`);
  colors = range(6).map(i => Color.random());
  ca = new CellularAutomaton(colors.slice(0, numColors), gridWidth, numInitialRows, cellConfig);
  ca.initialize(initialRowsStyle);
  ca.fillColorMatrix(gridHeight);
  colorMatrix.draw(magnification);
}


function refresh(initialRowsStyle, magKey) {
  // keep the current automaton rule, but update some image parameters, and draw it
  canvasUtil.clearCanvas();
  magnification = magnifications[magKey];
  let gridWidth = parseInt(WIDTH / magnification);
  gridHeight = parseInt(HEIGHT / magnification);
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
  let t0 =(new Date()).getTime();
  ca.iterateColorMatrix();
  let t1 = (new Date()).getTime();
  colorMatrix.draw(magnification);
  let t2 = (new Date()).getTime();
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = parseInt(document.getElementById("controls").clientWidth / 30) * 30; // round width to 30 = LCM of magnification values
    console.log(WIDTH);
    if (WIDTH <= 750) {
      HEIGHT = 1.5 * WIDTH;
    } else {
      HEIGHT = window.innerHeight - parseInt(1.25 * document.getElementById("controls").clientHeight);
    }
    console.log(HEIGHT);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT); //, document.outform.output);
    canvasUtil.clearCanvas();
    return setInterval(draw, 20);
  } else {
    alert('You need a better web browser to see this.');
  }
}
