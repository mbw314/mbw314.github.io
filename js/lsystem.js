const WIDTH = 750;
const HEIGHT = 750;

var canvas;
var ctx;
var canvasUtil;
var sysDrawer;

class Pen {
  // a component of a Turtle
  constructor(width, color, is_on) {
    this.width = width; // positive int
    this.color = color; // string
    this.is_on = is_on; // Boolean
  }
}


class Turtle {
  constructor(position, direction, pen) {
    this.pos = position; // Point object
    this.dir = direction; // Vec2D object
    this.pen = pen; // Pen object
    this.dist = dist0; // draw distance
    this.segments = []; // list of LineSegment objects to draw
    this.stack = []; // stack to store state?
  }

  pushState() {
    let state = [this.pos, this.dir, this.pen, this.dist];
    this.stack.push(state);
  }

  popState() {
    [this.pos, this.dir, this.pen, this.dist] = this.stack.pop();
  }

  draw() {
    for (let i in this.segments) {
      this.segments[i].draw(canvasUtil);
    }
  }

  printSegments() {
    for (let i in this.segments) {
      console.log(this.segments[i].toString());
    }
  }

  recenterPoints(w, h) {
    // 1. move the centroid of the segments to the origin (based on midpoints of line segments)
    let centroid = Point.centroid(this.segments.map(s => s.getMidpoint()));
    let origin = new Vec2D(0.0, 0.0);
    let dir = new Vec2D(-1 * centroid.x, -1 * centroid.y);
    //console.log('centroid = ' + centroid.toString() + '; norm = ' + dist.toString());
    this.segments.forEach(s => s.translate(dir, dir.norm()));

    // 2. rescale the points to appropriate canvas size
    // note: can't use Math.max(...[]) to get max, since we run into fuction argument limit
    let max_dist_from_origin = 0.0;
    this.segments
      .flatMap(s => [s.p0, s.p1]).forEach(p => {
        let d = p.distance(origin);
        if (d > max_dist_from_origin) {
          max_dist_from_origin = d;
        }});
    //console.log('max dist from origin = ' + max_dist_from_origin);
    let margin = 0.975;
    let scale_factor = margin * Math.min(w / 2.0, h / 2.0) / max_dist_from_origin;
    //console.log('scale factor = ' + scale_factor);
    // now rescale each point - since the centroid is (0, 0), it is preserved by rescaling
    this.segments.forEach(s => s.scale(scale_factor));

    // 3. move the centroid of the segments to the canvas center by translating each point
    let canvas_center = new Vec2D(w / 2.0, h / 2.0);
    this.segments.forEach(s => s.translate(canvas_center, canvas_center.norm()));
  }

  move() {
    let new_pos = this.pos.translate(this.dir, this.dist);

    if (this.pen.is_on) {
       let segment = new LineSegment(this.pos, new_pos, this.pen.color, this.pen.width);
       this.segments.push(segment);
    }

    this.pos = new_pos;
    //this.printStatus(`move ${dist}`);
  }

  rotate(theta) { // radians
     let new_dir = this.dir.rotate(theta);
     this.dir = new_dir;
     //this.printStatus(`rotate ${theta.toFixed(3)}`);
  }

  toString() {
    return `position: ${this.pos.toString()}; direction: ${this.dir.toString()}`;
  }

  printStatus(msg) {
    let s = this.toString();
    if (msg) {
      s = msg + '; ' + s
    }
    console.log(s);
  }
}


class LSystem {
  // TODO: can we get by with just a map of rules, so alphabet is represented by the keys?
  constructor(variables, constants, rules) {
    [this.variables, this.constants] = this.validateAlphabet(variables, constants);
    this.rules = this.validateRules(rules); // map of char -> string
    this.word = []; // char array representing current word
  }

  isValidWord(word) {
    let cs = word.split('');
    for (let i in cs) {
      if (!this.variables.has(cs[i]) && !this.constants.has(cs[i])) {
        console.log(`'character ${cs[i]} is outside the alphabet.'`);
        return false;
      }
    }
    return true;
  }

  setVariablesAndConstants(variables, constants) {
    [this.variables, this.constants] = this.validateAlphabet(variables, constants);
    //println('set variables and constants');
    //println(this.variables);
  }

  setRules(rules) {
    this.rules = this.validateRules(rules);
    //println('set new rules:');
    //println(rules.toString());
  }

  validateAlphabet(variables, constants) {
    let var_set = new Set(variables);
    let const_set = new Set(constants);
    for (let i in var_set) {
      if (const_set.has(var_set[i])) {
        throw new Error(`Variables and Constants cannot overlap. Both contain ${var_set[i]}`);
      }
    }
    return [var_set, const_set];
  }

  validateRules(rules) {
    for (let c in rules) {
      if (!this.variables.has(c)) {
        throw new Error(`bad character ${c} in rule set`);
      }
      if (!this.isValidWord(rules[c])) {
        throw new Error(`bad word ${c} -> ${rules[c]} in rule set`);
      }
    }
    return rules;
  }

  iterate() {
    // apply the rules once to the current word
    this.word = this.word
      .map(c => Object.keys(this.rules).includes(c) ? this.rules[c] : c)
      .flatMap(w => w.split(''));
    //console.log(this.word);
    return this.word;
  }

  setWord(word) {
    // validate and store a new axiom word
    if (this.isValidWord(word)) {
      this.word = word.split('');
      //console.log('Set new axiom word: ' + w0);
      //println('Set new axiom word: ' + w0);
    } else {
      throw new Error("word contains out-of-vocabulary characters");
    }
  }

  toString() {
    return [
      'L-System components:',
      '  variables: ' + Array.from(this.variables).join(', '),
      '  constants: ' + Array.from(this.constants).join(', '),
      '  axiom: ' + this.word.join(''),
      '  replacement rules:',
      Object.keys(this.rules).map(r => `    ${r} -> ${this.rules[r]}`)
    ].join('\n');
  }
}


class LSystemSpec {
  // hold paramters need to initialize an LSystem and translate its output
  // to be drawn by a Turtle
  constructor({
      name,
      variables = ['F'],
      constants = ['+', '-', '[', ']', '|', '>', '<'],
      rules,
      axiom,
      angle = Math.PI / 2.0,
      scale_factor = 1.0,
      actions = default_actions}) {
    this.name = name;
    this.variables = variables;
    this.constants = constants;
    this.rules = rules;
    this.axiom = axiom;
    this.angle = angle;
    this.scale_factor = scale_factor;
    this.actions = actions;
  }

  toString() {
    return [
      'L-System components:',
      '  name: ' + this.name,
      '  variables: ' + Array.from(this.variables).join(', '),
      '  constants: ' + Array.from(this.constants).join(', '),
      '  axiom: ' + this.axiom,
      '  replacement rules:',
      Object.keys(this.rules).map(r => `    ${r} -> ${this.rules[r]}`).join('\n'),
      '  angle: ' + this.angle.toFixed(5),
      '  scale_factor: ' + this.scale_factor.toFixed(5),
      '  actions:',
      Object.keys(this.actions).map(r => `    ${r} -> ${this.actions[r]}`).join('\n')
    ].join('\n');
  }
};

var color0 = "#000000";
var pen0 = new Pen(color0, 1, true);
var pos0 = new Point(0.0, 0.0);
var dir0 = new Vec2D(0.0, -1.0);
var dist0 = 1.0;
var scale_factor0 = 1.0;


class LSystemDrawer {
  // connect an LSystem and a Turtle in order to render the L-System to a canvas
  constructor(spec) {
    this.sys = new LSystem(spec.variables, spec.constants, spec.rules);
    this.sys.setWord(spec.axiom);
    this.turtle = new Turtle(pos0, dir0, pen0);
    //this.dist = dist0;
    this.angle = spec.angle;
    this.scale_factor = spec.scale_factor;
    this.actions = spec.actions;
    this.iteration = 0;
  }

  iterate() {
    let word = this.sys.iterate();
  }

  //draw_iteration(ctx) {
  draw() {
    let time0 = (new Date()).getTime();
    // translate the L-System string into sequence of Turtle drawing instructions
    canvasUtil.clearCanvas();
    //let word = this.sys.iterate();
    let word = this.sys.word;
    //console.log(word);
    this.turtle = new Turtle(pos0, dir0, pen0);
    for (let i in word) {
      //console.log(word[i]);
      let command = this.actions[word[i]];
      switch (command) {
        case actions.MOVE_FORWARD:
          this.turtle.move(this.dist);
          break;
        case actions.TURN_LEFT:
          this.turtle.rotate(this.angle);
          break;
        case actions.TURN_RIGHT:
          this.turtle.rotate(-1 * this.angle);
          break;
        case actions.TURN_AROUND:
          this.turtle.rotate(Math.PI);
          break;
        case actions.SCALE_UP:
          this.turtle.dist *= this.scale_factor;
          break;
        case actions.SCALE_DOWN:
          this.turtle.dist /= this.scale_factor;
          break;
        case actions.PUSH_STATE:
          this.turtle.pushState();
          break;
        case actions.POP_STATE:
          this.turtle.popState();
          break;
      }
    }
    this.turtle.recenterPoints(WIDTH, HEIGHT);
    //this.turtle.printSegments();
    this.turtle.draw();
    let time1 = (new Date()).getTime();
    canvasUtil.println(`drew iteration ${this.iteration} with ${this.turtle.segments.length} line segments in ${(time1 - time0) / 1000.0} seconds`);
    this.iteration += 1;

    // let test_set = new Set();
    // for (let i in this.turtle.segments) {
    //   test_set.add(this.turtle.segments[i]);
    // }
    // println(`testing storing segements in a set: length = ${test_set.size}`);
  }
}


const examples = {
  'ex1': {
    'rules': {'F': 'F+F-F-FF+F+F-F'},
    'axiom': 'F+F+F+F',
    'angle': Math.PI / 2.0
  },
  'ex2': {
    'rules': {'F': 'F-F+F'},
    'axiom': 'F+F+F',
    'angle': 2 * Math.PI / 3.0
  },
  'ex3': {
    'variables': ['F', 'X', 'Y'],
    'rules': {
      'X': '-YF+XFX+FY-',
      'Y': '+XF-YFY-FX+'
    },
    'axiom': 'X',
    'angle': Math.PI / 2.0
  },
  'ex4': {
    'variables': ['F', 'X'],
    'rules': {'X': 'XF-F+F-XF+F+XF-F+F-X'},
    'axiom': 'F+XF+F+XF',
    'angle': Math.PI / 2.0
  },
  'ex5': {
    'rules': {'F': 'FF+F++F+F'},
    'axiom': 'F+F+F+F',
    'angle': Math.PI / 2.0
  },
  'ex6': {
    'variables': ['F', 'X', 'Y'],
    'rules': {
      'X': 'YF+XF+Y',
      'Y': 'XF-YF-X'
      },
    'axiom': 'YF',
    'angle': Math.PI / 3.0
  },
  'ex7': {
    'variables': ['F', 'X', 'Y'],
    'rules': {
      'X': 'X+YF+',
      'Y': '-FX-Y'
    },
    'axiom': 'FX',
    'angle': Math.PI / 2.0
  },
  'ex8': {
    'variables': ['F', 'X'],
    'rules': {
      'X': 'F+[[X]-X]-F[-FX]+X',
      'F': 'FF'
    },
    'axiom': 'FX',
    'angle': 25 * Math.PI / 180.0
  },
  'ex9': {
    'rules': {
      'F': 'FF+[+F-F-F]-[-F+F+F]'
    },
    'axiom': 'F',
    'angle': 22.5 * Math.PI / 180.0
  },
  'ex10': {
    'rules': {
      'F': 'F++F++F|F-F++F'
    },
    'axiom': 'F++F++F++F++F',
    'angle': 36 * Math.PI / 180.0
  },
  'ex11': {
    'variables': ['F', 'X', 'Y'],
    'rules': {
      'X': 'X+YF++YF-FX--FXFX-YF+',
      'Y': '-FX+YFYF++YF+FX--FX-Y'
    },
    'axiom': 'FX',
    'angle': 60.0 * Math.PI / 180.0
  },
  'ex12': {
    'variables': ['F', '6', '7', '8', '9'],
    'rules': {
      'F': '',
      '6': '8F++9F----7F[-8F----6F]++',
      '7': '+8F--9F[---6F--7F]+',
      '8': '-6F++7F[+++8F++9F]-',
      '9': '--8F++++6F[+9F++++7F]--7F',
    },
    'axiom': '[7]++[7]++[7]++[7]++[7]',
    'angle': 36.0 * Math.PI / 180.0
  },
  'ex13': {
    'variables': ['F', 'W', 'X', 'Y', 'Z'],
    'rules': {
      'W': '+++X--F--ZFX+',
      'X': '---W++F++YFW-',
      'Y': '+ZFX--F--Z+++',
      'Z': '-YFW++F++Y---'
    },
    'axiom': 'W',
    'angle': 30.0 * Math.PI / 180.0
  },
  'ex14': {
    'variables': ['F', 'X'],
    'rules': {
      'F': 'FF',
      'X':  'F+[-F-XF-X][+FF][--XF[+X]][++F-X]'
    },
    'axiom': 'X',
    'angle': 22.5 * Math.PI / 180.0
  },
  'ex15': {
    'variables': ['F', 'X'],
    'rules': {
      'X': '>[FX][>-----FX][>+++++FX]'
    },
    'axiom': '[FX]++++[>FX]++++[FX]++++[>FX]++++[FX]++++[>FX]',
    'angle': 15 * Math.PI / 180.0,
    'scale_factor': 0.6
  },
  'ex16': {
    'variables': ['F', 'X', 'Y'],
    'rules': {
      'X': 'X+YF++YF-FX--FXFX-YF+X',
      'Y': '-FX+YFYF++YF+FX--FX-YF'
    },
    'axiom': 'X+X+X+X+X+X+X+X',
    'angle': 45 * Math.PI / 180.0,
  },
  'ex17': {
    'variables': ['F', 'X', 'Y', 'a', 'b'],
    'rules': {
      'F': '>F<',
      'a': 'F[+X]Fb',
      'b': 'F[-Y]Fa',
      'X': 'a',
      'Y': 'b'
    },
    'axiom': 'a',
    'angle': 45 * Math.PI / 180.0,
    'scale_factor': 1.36
  },
  'ex18': {
    'variables': ['F', 'X'],
    'rules': {
      'X': '>[---FX][++>FX]'
    },
    'axiom': '[FX]++++++[FX]++++++[FX]',
    'angle': 20 * Math.PI / 180.0,
    'scale_factor': 0.735
  }
}

// easier testing? https://jobtalle.com/lindenmayer_systems.html
// lots of examples: http://paulbourke.net/fractals/lsys/

const actions = {
  'MOVE_FORWARD': 'move forward',
  'TURN_LEFT': 'turn left',
  'TURN_RIGHT': 'turn right',
  'TURN_AROUND': 'turn around',
  'SCALE_UP': 'scale up',
  'SCALE_DOWN': 'scale down',
  'PUSH_STATE': 'push state',
  'POP_STATE': 'pop state'
};

// translate LSystem symbols into Turtle actions
const default_actions = {
  'F': actions.MOVE_FORWARD,
  '+': actions.TURN_LEFT,
  '-': actions.TURN_RIGHT,
  '|': actions.TURN_AROUND,
  '>': actions.SCALE_UP,
  '<': actions.SCALE_DOWN,
  '[': actions.PUSH_STATE,
  ']': actions.POP_STATE
};



//
// function println(msg) {
//   document.outform.output.value += msg + '\n';
//   console.log(msg);
// }

// function clear_text() {
//   document.outform.output.value = "";
// }

// function clear_canvas() {
//   ctx.fillStyle = "#FFFFFF";
//   ctx.beginPath();
//   ctx.rect(0, 0, WIDTH, HEIGHT);
//   ctx.closePath();
//   ctx.fill();
// }

function draw_iteration() {
  // draw another iteration of the current LSystem when the 'draw next iteration' button is pressed
  sysDrawer.iterate();
  sysDrawer.draw(ctx);
  //sysDrawer.draw_iteration(ctx);
}

function load_example(ex) {
  // load the selected example when the 'load example' button is pressed
  canvasUtil.clearText();
  let spec = new LSystemSpec(Object.assign({'name': ex}, examples[ex]));
  //console.log(spec.toString());
  canvasUtil.println(spec.toString());
  sysDrawer = new LSystemDrawer(spec);
  //sysDrawer.draw_iteration(ctx);
  sysDrawer.draw();
}

function init() {
  canvas = document.getElementById('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    load_example('ex1');
  }
}
