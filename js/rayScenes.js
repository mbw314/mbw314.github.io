// definitions of scenes/lighting

const m1 = new Material(1.0, 0.0, 0.0); // no specular effects
const m2 = new Material(0.75, 0.8, 15);
const m3 = new Material(0.5, 1.0, 25);

const planeTestScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray.minus(purple).scale(0.5 * Math.sin(0.5 * p.z + 0.5 * p.y) + 1).plus(purple), // smoothed stripes
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, 5, 0),
    v => lightGray,
    m1,
    negVecJ
  ),
  new Plane( // right
    new Vec3D(0, -5, 0),
    v => lightGray,
    m1,
    vecJ
  )
];

const planeTestLights = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.85, 0.95, 0.72))
];


const sphereTestScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -2),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new Sphere(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? white : red, // stripes,
    m2,
    1
  ),
  new Sphere(
    new Vec3D(0, 0, 3),
    v => green,
    m2,
    0.5
  )
];

const sphereTestLights = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(0, 5, 5), new Vec3D(0.75, 0.75, 0.62))
];


const boxTestScene = [
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new Box(
    new Vec3D(5, 2, 0),
    v => blueGreen,
    m1,
    new Vec3D(2, 3, 1.5)
  ),
  new Box(
    new Vec3D(1.5, -3.0, 1.75),
    v => green,
    m1,
    new Vec3D(5.5, -0.75, 2.5)
  )
];

const boxTestLights = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.55, 0.72)),
  new LightSource(new Vec3D(0, 5, 5), new Vec3D(0.75, 0.75, 0.52))
];


const cylinderTestScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new VerticalCylinder(
    new Vec3D(0, 3, 2),
    v => purple,
    m2,
    0.5,
    1,
    true,
    false
  ),
  new VerticalCylinder(
    new Vec3D(0, 0, 0),
    v => red,
    m2,
    1,
    2,
    false,
    false
  ),
  new VerticalCylinder(
    new Vec3D(0, -3, -2),
    v => green,
    m2,
    0.5,
    1,
    false,
    true
  )
];

const cylinderTestLights = [
  new LightSource(new Vec3D(0, 0, 0.5), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(0, 0, 5), new Vec3D(0.75, 0.75, 0.62))
];


const paraboloidTestScene1 = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => lightGray,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? blue : lightGray, // stripes
    m2,
    -0.05,
    0.05,
    p => true,
  )
];

const paraboloidTestLights1 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
 ];


// rim issue
const paraboloidTestScene2 = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => (parseInt(Math.round(p.y) + Math.round(p.z)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    negVecI
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? red : lightGray, // stripes
    m2,
    -0.15,
    0.15,
    p => -2 <= p.x && p.x <= 2 && -2 <= p.y && p.y <= 2 // rectangle
  )
];

const paraboloidTestLights2 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
];


// rim issue
const paraboloidTestScene3 = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(10, 0, 0),
    p => (parseInt(Math.round(p.y) + Math.round(p.z)) % 2 == 0) ? blue : lightGray, // checkerboard,
    m1,
    negVecI
  ),
  new Paraboloid(
    new Vec3D(0, 0, 2),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? red : lightGray, // stripes
    m2,
    0.15,
    0.15,
    p => p.x * p.x + p.y * p.y < 3 * 3 // disk
  )
];

const paraboloidTestLights3 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
];


// objects are only partially observed depending on if camera is above/below the "rim" (if upward/downward opening)
const paraboloidTestScene4 = [
  new Plane( // bottom
    new Vec3D(0, 0, -2),
    p => (parseInt(Math.round(p.x) + Math.round(p.y)) % 2 == 0) ? blue : lightGray, // checkerboard
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(5, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -5, 0),
    p => lightGray,
    m1,
    vecJ
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(2 * p.x) + Math.round(2 * p.y)) % 2 == 0) ? blue : red, // checkerboard
    m2,
    -0.2,
    -0.2,
    p => p.x * p.x + p.y * p.y < 4 // disk
  ),
  new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(2 * p.x) + Math.round(2 * p.y)) % 2 == 0) ? blue : red, // checkerboard
    m2,
    0.2,
    0.2,
    p => p.x * p.x + p.y * p.y < 4 // disk
  )
];

const paraboloidTestLights4 = [
  new LightSource(new Vec3D(0, 0, 10), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(0, 5, 0), new Vec3D(0.75, 0.75, 0.62)),
];

const cylCenter = new Vec3D(5, 0, -2);
const testScene = [
  new Plane( // bottom
    new Vec3D(0, 0, -5),
    p => darkGray,
    m1,
    vecK
  ),
  new Plane( // back
    new Vec3D(12, 0, 0),
    p => lightGray,
    m1,
    negVecI
  ),
  new Plane( // left
    new Vec3D(0, -7.5, 0),
    p => lightGray.minus(purple).scale(0.5 * Math.sin(0.5 * p.z + 0.5 * p.y) + 1).plus(purple), // smoothed stripes,
    m1,
    vecJ
  ),
  new Sphere(
    new Vec3D(5, 0, 6),
    p => yellow,
    m2,
    2
  ),
  new Paraboloid(
    new Vec3D(5, 0, -2),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? blue : lightGray, // stripes
    m2,
    -0.12,
    0.12,
    p => true
  ),
  new Paraboloid(
    new Vec3D(3, 5.5, -0.5),
    p => (parseInt(Math.round(2 * p.x) + Math.round(2 * p.y)) % 2 == 0) ? blueGreen : gray, // checkerboard
    m3,
    -0.1,
    -0.15,
    p => (p.x + 1) * (p.x + 1) + (p.y - 3) * (p.y - 3)  < 4 * 4 // disk
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    1,
    1.5,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => red,
    m2,
    1.5,
    1.25,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    2.25,
    1,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => red,
    m2,
    3,
    0.75,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    4,
    0.5,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => red,
    m2,
    5,
    0.25,
    false,
    false
  ),
  new VerticalCylinder(
    cylCenter,
    v => lightBlue,
    m2,
    15,
    0.125,
    false,
    false
  ),
  new Box(
    new Vec3D(5, -10, -3),
    v => purple,
    m3,
    new Vec3D(-3, -1, -15)
  ),
  new Box(
    new Vec3D(5, -10, -3),
    v => green,
    m2,
    new Vec3D(-2, -2, -2)
  ),
  new Box(
    new Vec3D(5, -10, -2),
    v => purple,
    m3,
    new Vec3D(-1, -3, -1)
  ),
  new Box(
    new Vec3D(5, -10, -1),
    v => green,
    m2,
    new Vec3D(0, -4, 0)
  ),
  new Box(
    new Vec3D(5, -10, 0),
    v => purple,
    m3,
    new Vec3D(1, -5, 1)
  ),
  new Box(
    new Vec3D(5, -10, 1),
    v => green,
    m2,
    new Vec3D(2, -6, 2)
  )
];

const testLights = [
  new LightSource(new Vec3D(9, 5, 8), new Vec3D(0.65, 0.65, 0.72)),
  new LightSource(new Vec3D(-10, -2, 5), new Vec3D(0.75, 0.75, 0.62))
];
