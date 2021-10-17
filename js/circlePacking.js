let WIDTH = 750;
let HEIGHT = 750;
let canvasUtil;
let paused = false;
let drawLabels = false;

let MAX_RADIUS = 150;
let circles = [];
let RADIUS_INCREMENT = 0.5;
let MAX_CIRCLES = 200;

let DISTANCE_BUFFER = 2;
let keepCirclesInCanvas = false;

class Circle {
  constructor(center, radius, color, index, isComplete) {
    this.center = center; // Point
    this.radius = radius; // float
    this.color = color; // Color
    this.index = index; // int
    this.isComplete = false; // bool
    this.neighborIndices = new Set(); // Set of int
  }

  toString() {
    return `center=${this.center.toString()}; radius=${this.radius}; color=${this.color.toString()}; index=${this.index}; neighbors=${this.neighborIndices}}; isComplete=${this.isComplete}`;
  }

  draw() {
    canvasUtil.drawDisk(this.center.x, this.center.y, this.radius, this.color.toString());
  }

  drawSimple(drawLabels) {
    canvasUtil.drawCircle(this.center.x, this.center.y, this.radius, "black", 1);
    if (drawLabels) {
      canvasUtil.drawText(`${this.index}`, this.center.x, this.center.y, 10);
    }
  }

  contains(p) {
    // check if the disk bounded by this circle contains a given point
    return this.center.distanceSq(p) < (this.radius + DISTANCE_BUFFER) * (this.radius + DISTANCE_BUFFER);
  }

  intersects(c) {
    // check if the interior of this circle intersects that of another
    return this.center.distance(c.center) < this.radius + c.radius - 0.5; // buffer
  }

  circleDistance(c) {
    // "distance" between centers - radius1 - radius2
    // =0 if circles are tangent
    // >0 if they are disjoint
    // <0 if they do intersect
    return this.center.distance(c.center) - this.radius - c.radius;
  }

  displayedArea() {
    // TODO: area displayed on the canvas (intesection of disk and rectangle)
    return 0
  }

  numNeighbors() {
    return this.neighborIndices.size;
  }

  connectCenters(c) {
    canvasUtil.drawLine(
      this.center.x,
      this.center.y,
      c.center.x,
      c.center.y,
      "red",
      2
    );
  }
}


function isInCanvas(c, r, keepInCanvas) {
  if (keepInCanvas) {
    if (c.x - r >= 0 && c.x + r <= WIDTH && c.y - r >= 0 && c.y + r <= HEIGHT) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

function pauseDrawing() {
  paused = !paused;
}


function drawSimpleLabels() {
  drawLabels = !drawLabels;
}


function resetDrawing() {
  circles = [];
  d = new Circle(new Point(Math.random() * WIDTH, Math.random() * HEIGHT), 1.5 * MAX_RADIUS, Color.random(), 0, false);
  circles.push(d);
}

function draw() {
  if (paused) {
    return 0;
  }

  // main drawing code
  canvasUtil.clearCanvas();

  let time = new Date();
  let t = time.getMilliseconds() / 10;

  /*
  algorithm:
  current circle <- last circle in array
  if current circle is not complete
    if current radius < MAX_RADIUS
      if 0 nbrs
        increase radius, unless nbr is found
      else if 1 nbr
        increase radius and move center away from nbr center, unless new nbr is found
      else if 2 nbrs
        increase radius and move away from nbrs (according to a complicated formula), unless new nbr is found
        if nbr is found, the current circle is complete
    else
      circle is complete
  else if #circles < MAX_CIRCLES
    add new circle to array
  else
    stop drawing / pause
  */

  let currentCircle = circles[circles.length - 1];
  if (!currentCircle.isComplete) {
    if (currentCircle.radius < MAX_RADIUS) {  // still room to increase radius
      let radiusIncrement = RADIUS_INCREMENT;
      if (currentCircle.numNeighbors() == 0) {
        // increase radius of current circle to MAX_RADIUS or until nbr is found
        if (circles.length > 1) { // non-degenerate case: there are actually neighbors to consider
          let closestCircleData = getClosestCircle(currentCircle);  // index, distance
          //currentCircle.connectCenters(circles[closestCircleData[0]]);
          if (radiusIncrement > closestCircleData[1]) { // incrementing would overlap with closest circle => now have a neighbor
            radiusIncrement = Math.max(0, closestCircleData[1]);
            currentCircle.neighborIndices.add(closestCircleData[0]);
            circles[closestCircleData[0]].neighborIndices.add(currentCircle.index);
          }
        }
        currentCircle.radius += radiusIncrement;
      } else if (currentCircle.numNeighbors() == 1) {
        // one neighbor, move center away from the neighbor along line through both centers and expand the radius
        let neighborIndex = [...currentCircle.neighborIndices][0];
        let dir = Vec2D.fromPoint(currentCircle.center).minus(Vec2D.fromPoint(circles[neighborIndex].center)).toUnitVector();
        let newRadius = currentCircle.radius + radiusIncrement;
        let newCenter = currentCircle.center.translate(dir, radiusIncrement);
        if (circles.length > 2) { // non-degenerate case: there are actually other neighbors to consider
          let closestCircleData = getClosestCircle(currentCircle);  // index, distance
          //currentCircle.connectCenters(circles[closestCircleData[0]]);
          // ensure that future position of circle does not intersect closest circle
          let wouldIntersect = circles[closestCircleData[0]].intersects(
            new Circle(newCenter, newRadius, Color.random(), -1, true)
          );
          if (wouldIntersect) { // readjust the radius increment
            radiusIncrement = Math.max(0, closestCircleData[1]);
            newRadius = currentCircle.radius + radiusIncrement;
            newCenter = currentCircle.center.translate(dir, radiusIncrement);
            currentCircle.neighborIndices.add(closestCircleData[0]);
            circles[closestCircleData[0]].neighborIndices.add(currentCircle.index);
          }
        }
        currentCircle.center = newCenter;
        currentCircle.radius = newRadius;
      } else if (currentCircle.numNeighbors() == 2) {
        // two neighbors, move center away from the neighbors according to complex formula
        let neighborIndices = [...currentCircle.neighborIndices];
        let neighbor1 = circles[neighborIndices[0]];
        let neighbor2 = circles[neighborIndices[1]];
        let newRadius = currentCircle.radius + radiusIncrement;
        let newCenter = get2NeighborCenter(currentCircle, neighbor1, neighbor2, radiusIncrement);
        if (circles.length > 3) {  // non-degenerate case: there are actually other neighbors to consider
          let keepTrying = true;
          let maxAttempts = 10;
          let attempts = 0;
          let buffer = 1.25;
          let minIncrement = 0.000001;
          let reductionFactor = 0.85;
          radiusIncrement = RADIUS_INCREMENT * (currentCircle.radius / MAX_RADIUS) * 0.5; // position of new center changes rapidly as function of radius, so decrease it here to avoid overlapping circles
          while (keepTrying) {  // need a way to keep the center from changing too muc
            let closestCircleData = getClosestCircle(currentCircle);  // index, distance
            // currentCircle.connectCenters(circles[closestCircleData[0]]);
            let dist =  circles[closestCircleData[0]].circleDistance(new Circle(newCenter, newRadius, Color.random(), -1, true));
            if (dist > buffer) { // far enough away from closest non-neighbor
              // canvasUtil.println(`update to circle ${currentCircle.index} was successfull; sufficiently far from circle ${closestCircleData[0]} with radiusIncrement=${radiusIncrement}`);
              keepTrying = false;
            } else if ((-buffer < dist) && (dist < buffer)) { // close enough to consider it a neighbor
              // canvasUtil.println(`update to circle ${currentCircle.index} was successful; tangent to circle ${closestCircleData[0]} with radiusIncrement=${radiusIncrement}`);
              currentCircle.neighborIndices.add(closestCircleData[0]);
              circles[closestCircleData[0]].neighborIndices.add(currentCircle.index);
              currentCircle.isComplete = true;
              keepTrying = false;
            } else { // keep trying
              if (radiusIncrement * reductionFactor > minIncrement && attempts <= maxAttempts) {
                // canvasUtil.println(`update #${attempts} to circle ${currentCircle.index} was NOT successful; tried ${radiusIncrement}, retrying with radiusIncrement = ${radiusIncrement * reductionFactor}`);
                radiusIncrement *= reductionFactor;
                newRadius = currentCircle.radius + radiusIncrement;
                newCenter = get2NeighborCenter(currentCircle, neighbor1, neighbor2, radiusIncrement);
                attempts += 1;
              } else {
                // canvasUtil.println(`update to circle ${currentCircle.index} was NOT successful; potential radiusIncrement=${radiusIncrement * reductionFactor} is too small, so we're probably good enough?`);
                currentCircle.neighborIndices.add(closestCircleData[0]);
                circles[closestCircleData[0]].neighborIndices.add(currentCircle.index);
                currentCircle.isComplete = true;
                keepTrying = false;
              }
            }
          }
        }
        currentCircle.center = newCenter;
        currentCircle.radius = newRadius;

        // final check for intersections with neighbors
        // let intersections = [...currentCircle.neighborIndices].map(n => [n, currentCircle.intersects(circles[n])]).filter(n => n[1]).map(n => n[0]);
        // if (intersections.length > 0) {
        //   canvasUtil.println(`current circle ${currentCircle.index} intersects other circle(s): ${intersections.map(n => [n, currentCircle.circleDistance(circles[n])])}`);
        // }
      }
    } else {
      currentCircle.isComplete = true;
    }
  } else if (circles.length < MAX_CIRCLES) {
    // otherwise make a new circle (with center NOT contained in another circle) and draw it
    let searchingForPoint = true;
    let p = new Point(-100, -100);
    while (searchingForPoint) {
      possibleP = new Point(Math.random() * WIDTH, Math.random() * HEIGHT);
      let containmentStatuses = circles.map(d => d.contains(possibleP));
      if (!containmentStatuses.includes(true)) {
        p = possibleP;
        searchingForPoint = false;
      }
    }
    let d = new Circle(p, 1, Color.random(), circles.length, false);
    circles.push(d);
  } else {
    canvasUtil.println(`nothing else to draw`);
    paused = true;
  }

  // draw everything
  if (document.parameters.drawing_style.value == "simple" || document.parameters.drawing_style.value == "connections") {
    for (let i=0; i<circles.length; i++) {
      circles[i].drawSimple(drawLabels);
      if (document.parameters.drawing_style.value == "connections") {
        circles[i].neighborIndices.forEach(n => {
          canvasUtil.drawLine(circles[i].center.x, circles[i].center.y, circles[n].center.x, circles[n].center.y, "red", 0.5);
        });
      }
    }
    if (document.parameters.drawing_style.value == "connections") {
      circles.forEach(d => canvasUtil.drawDisk(d.center.x, d.center.y, Math.min(2, d.radius), "black"));
    }
  } else if (document.parameters.drawing_style.value == "colorful") {
    for (let i=0; i<circles.length; i++) {
      circles[i].draw();
    }
  }

  canvasUtil.clearText();
  //let avgRadius = circles.map(d => d.radius).reduce((x, y) => x + y) / circles.length).toFixed(3);
  let avgDegree = (circles.slice(0, circles.length - 1).map(d => d.numNeighbors()).reduce((x, y) => x + y) / circles.length).toFixed(3)
  let minDegree = Math.min(...circles.slice(0, circles.length - 1).map(d => d.numNeighbors()));
  canvasUtil.println(`${circles.length} circles; min degree = ${minDegree}; avg degree = ${avgDegree}`); //`; average radius is ${(avgRadius}; average number of neighbors is ${avgDegree}`);
}


function init(adjustSize) {
  let canvas = document.getElementById("canvas");
  if (parseInt(adjustSize) > 0) {
    WIDTH = document.getElementById("content").clientWidth;
    HEIGHT = window.innerHeight - parseInt(2 * document.getElementById("controls_table").clientHeight);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  if (canvas.getContext){
    let ctx = canvas.getContext('2d');
    canvasUtil = new CanvasUtil(ctx, WIDTH, HEIGHT, document.outform.output);
    resetDrawing();

    // canvasUtil.clearCanvas();
    // let x1 = 375;
    // let y1 = -1000;
    // let r1 = 1350;
    // let c1 = new Circle(new Point(x1, y1), r1, new Color(200, 200, 200), 0, true);
    // circles.push(c1);
    //
    // let x2 = -150;
    // let y2 = 375;
    // let r2 = 250;
    // let c2 = new Circle(new Point(x2, y2), r2, new Color(200, 200, 200), 1, true);
    // circles.push(c2);
    //
    // let x3 = 900;
    // let y3 = 375;
    // let r3 = 250;
    // let c3 = new Circle(new Point(x3, y3), r3, new Color(200, 200, 200), 2, true);
    // circles.push(c3);
    //
    // let x4 = 300;
    // let y4 = 1200;
    // let r4 = 800;
    // let c4 = new Circle(new Point(x4, y4), r4, new Color(200, 200, 200), 3, true);
    // circles.push(c4);
    //
    // let x5 = 205;
    // let y5 = 375;
    // let r5 = 1;
    // let c5 = new Circle(new Point(x5, y5), r5, new Color(200, 200, 200), 4, false);
    // circles.push(c5);
    //
    // let r = 75;
    // let ps = getCenterCandidates(x1, y1, r1, x2, y2, r2, r);
    // let cs = ps.map(p => new Circle(p, r, Color.random(), 2, false));
    // cs.forEach(c => canvasUtil.println(c.toString()));
    // cs.forEach(c => c.drawSimple());

    return setInterval(draw, 5);

  } else {
    alert('You need a better web browser to see this.');
  }
}


function getClosestCircle(currentCircle) {
  // get the circle closest to the given circle, excluding any neighbors
  let distancesMap = new Map(
    circles
    .slice(0, circles.length - 1)
    .filter(d => !currentCircle.neighborIndices.has(d.index))
    .map(d => [d.index, d.center.distance(currentCircle.center) - d.radius - currentCircle.radius])
  );
  return [...distancesMap.entries()].sort((x, y) => x[1] - y[1])[0]; // index, distance
}


function get2NeighborCenter(currentCircle, neighbor1, neighbor2, radiusIncrement) {
  // the equation for the possible center point has 2 solutions; take the one closest to the current center
  let candidateCenters = getCenterCandidates(
    neighbor1.center.x,
    neighbor1.center.y,
    neighbor1.radius,
    neighbor2.center.x,
    neighbor2.center.y,
    neighbor2.radius,
    currentCircle.radius + radiusIncrement
  );
  return candidateCenters.map(p => [p, p.distance(currentCircle.center)]).sort((x, y) => x[1] - y[1])[0][0];
}


function getCenterCandidates(x1, y1, r1, x2, y2, r2, r) {
  /*
  What are the possible center points of a circle that is tangent to two other circles,
  in terms of the circle's radius and the data of those two tangent circles?

  Ludricrous solution obtained from these Sage commands:

  > x,y,r,x1,y1,r1,x2,y2,r2 = var('x,y,r,x1,y1,r1,x2,y2,r2')
  > assume(r1>0, r2>0, r>0)
  > eqn1 = ((x-x1)^2 + (y-y1)^2 == (r+r1)^2)
  > eqn2 = ((x-x2)^2 + (y-y2)^2 == (r+r2)^2)
  > solve([eqn1, eqn2], x, y)
  */

  let denom = x1**2 - 2*x1*x2 + x2**2 + y1**2 - 2*y1*y2 + y2**2;

  let xNumA = x1**3 - x1*x2**2 + x2**3 + (x1 + x2)*y1**2 - 2*(x1 + x2)*y1*y2 + (x1 + x2)*y2**2
    - (2*r*r1 + r1**2 - 2*r*r2 - r2**2)*x1 + (2*r*r1 + r1**2 - 2*r*r2 - r2**2 - x1**2)*x2;

  let yNumA = y1**3 - y1*y2**2 + y2**3 - (2*r*r1 + r1**2 - 2*r*r2 - r2**2 - x1**2 + 2*x1*x2 - x2**2)*y1
    + (2*r*r1 + r1**2 - 2*r*r2 - r2**2 + x1**2 - 2*x1*x2 + x2**2 - y1**2)*y2;

  let sqrtD = Math.sqrt(
    -4*r**2*r1**2 - 4*r*r1**3 - r1**4 - 4*r*r2**3 - r2**4 - x1**4 + 4*x1*x2**3 - x2**4 - y1**4 + 4*y1*y2**3 - y2**4
    - 2*(2*r**2 - 2*r*r1 - r1**2)*r2**2 + 2*(2*r**2 + 2*r*r1 + r1**2 + 2*r*r2 + r2**2)*x1**2
    + 2*(2*r**2 + 2*r*r1 + r1**2 + 2*r*r2 + r2**2 - 3*x1**2)*x2**2
    + 2*(2*r**2 + 2*r*r1 + r1**2 + 2*r*r2 + r2**2 - x1**2 + 2*x1*x2 - x2**2)*y1**2
    + 2*(2*r**2 + 2*r*r1 + r1**2 + 2*r*r2 + r2**2 - x1**2 + 2*x1*x2 - x2**2 - 3*y1**2)*y2**2
    + 4*(2*r**2*r1 + r*r1**2)*r2 + 4*(x1**3 - (2*r**2 + 2*r*r1 + r1**2 + 2*r*r2 + r2**2)*x1)*x2
    + 4*(y1**3 - (2*r**2 + 2*r*r1 + r1**2 + 2*r*r2 + r2**2 - x1**2 + 2*x1*x2 - x2**2)*y1)*y2
  );

  return [
    new Point(
      0.5 * (xNumA + (y1 - y2) * sqrtD) / denom,
      0.5 * (yNumA - (x1 - x2) * sqrtD) / denom
    ),
    new Point(
      0.5 * (xNumA - (y1 - y2) * sqrtD) / denom,
      0.5 * (yNumA + (x1 - x2) * sqrtD) / denom
    )
  ]
}
