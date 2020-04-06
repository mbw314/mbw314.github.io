
function test_box() {
  // test with box = [-1, 1] x [-1, 1] x [-1, 1]
  let box = new Box(
    new Vec3D(-1, -1, -1),
    v => red,
    new Material(1.0, 1.0, 5),
    new Vec3D(1, 1, 1)
  )
  console.log(`testing box  ${box.toString()}`);

  console.log('testing ray from negative x-direction');
  let rayBase = new Vec3D(-2, 0, 0);
  let rayDir = new Vec3D(1, 0, 0);
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  let t = box.rayIntersects(rayBase, rayDir);
  let point = rayBase.plus(rayDir.scale(t));
  let normal = box.normalFn(point);
  console.log('expected: point = (-1, 0, 0); normal = (-1, 0, 0)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, negVecI));
  console.assert(vec_near(normal, negVecI));
  console.log('----------------------');

  console.log('testing ray from positive x-direction');
  rayBase = new Vec3D(2, 0, 0);
  rayDir = new Vec3D(-1, 0, 0);
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (1, 0, 0); normal = (1, 0, 0)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, vecI));
  console.assert(vec_near(normal, vecI));
  console.log('----------------------');

  console.log('testing ray from negative y-direction');
  rayBase = new Vec3D(0, -2, 0);
  rayDir = new Vec3D(0, 1, 0);
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (0, -1, 0); normal = (0, -1, 0)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, negVecJ));
  console.assert(vec_near(normal, negVecJ));
  console.log('----------------------');

  console.log('testing ray from positive y-direction');
  rayBase = new Vec3D(0, 2, 0);
  rayDir = new Vec3D(0, -1, 0);
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (0, 1, 0); normal = (0, 1, 0)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, vecJ));
  console.assert(vec_near(normal, vecJ));
  console.log('----------------------');

  console.log('testing ray from negative z-direction');
  rayBase = new Vec3D(0, 0, -2);
  rayDir = new Vec3D(0, 0, 1);
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (0, 0, -1); normal = (0, 0, -1)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, negVecK));
  console.assert(vec_near(normal, negVecK));
  console.log('----------------------');

  console.log('testing ray from positive z-direction');
  rayBase = new Vec3D(0, 0, 2);
  rayDir = new Vec3D(0, 0, -1);
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (0, 0, 1); normal = (0, 0, 1)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, vecK));
  console.assert(vec_near(normal, vecK));
  console.log('----------------------');

  console.log('testing non-axis ray 1');
  rayBase = new Vec3D(-2, -1, 0);
  rayDir = new Vec3D(1, 1, 0).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (-1, 0, 0); normal = (-1, 0, 0)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, negVecI));
  console.assert(vec_near(normal, negVecI));
  console.log('----------------------');

  console.log('testing non-axis ray 2');
  rayBase = new Vec3D(1, 2, 0);
  rayDir = new Vec3D(-1, -1, 0).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = box.normalFn(point);
  console.log('expected: point = (0, 1, 0); normal = (0, 1, 0)');
  console.log(`got point = ${point.toString()}; normal = ${normal.toString()}`);
  console.assert(vec_near(point, vecJ));
  console.assert(vec_near(normal, vecJ));
  console.log('----------------------');

  console.log('testing miss 1');
  rayBase = new Vec3D(-2, 0, 0);
  rayDir = new Vec3D(0, 1, 0).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  console.log('expected: t = undefined');
  console.log(`got t = ${t}`);
  console.assert(!t);
  console.log('----------------------');

  console.log('testing miss 2');
  rayBase = new Vec3D(-2, -2, -2);
  rayDir = new Vec3D(0, 1, 0).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  console.log('expected: t = undefined');
  console.log(`got t = ${t}`);
  console.assert(!t);
  console.log('----------------------');

  console.log('testing miss 3');
  rayBase = new Vec3D(-2, -2, -2);
  rayDir = new Vec3D(0, 0, 1).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  console.log('expected: t = undefined');
  console.log(`got t = ${t}`);
  console.assert(!t);
  console.log('----------------------');

  console.log('testing miss 4');
  rayBase = new Vec3D(-2, -2, -2);
  rayDir = new Vec3D(1, 0, 0).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = box.rayIntersects(rayBase, rayDir);
  console.log('expected: t = undefined');
  console.log(`got t = ${t}`);
  console.assert(!t);
  console.log('----------------------');

  console.log('--------------------');
  console.log('-----END OF TESTS---');
  console.log('--------------------');
}

function test_cylinder() {
  // test cylinder with p0 = (0, 0, -1), height = 2, radius = 1, axisDir = K;
  let cyl = new VerticalCylinder(
    new Vec3D(0, 0, -1),
    v => red,
    new Material(1.0, 1.0, 5),
    2,
    1,
    true,
    true
  );
  console.log(cyl.toString());

  console.log('test normal to top of cylinder');
  let v = new Vec3D(-0.2, 0, 1);
  let normal = cyl.normalFn(v);
  console.log('expected: normal = (0, 0, 1)');
  console.log(`got normal = ${normal.toString()}`);
  console.assert(normal.near(vecK));
  console.log('--------------------');

  console.log('test normal to bottom of cylinder');
  v = new Vec3D(0, 0.4, -1);
  normal = cyl.normalFn(v);
  console.log('expected: normal = (0, 0, -1)');
  console.log(`got normal = ${normal.toString()}`);
  console.assert(normal.near(negVecK));
  console.log('--------------------');

  console.log('test normal to side of cylinder 1');
  v = new Vec3D(1, 0, -0.5);
  normal = cyl.normalFn(v);
  console.log('expected: normal = (1, 0, 0)');
  console.log(`got normal = ${normal.toString()}`);
  console.assert(normal.near(vecI));
  console.log('--------------------');

  console.log('test normal to side of cylinder 2');
  v = new Vec3D(0, 1, 0.3);
  normal = cyl.normalFn(v);
  console.log('expected: normal = (0, 1, 0)');
  console.log(`got normal = ${normal.toString()}`);
  console.assert(normal.near(vecJ));
  console.log('--------------------');

  console.log('test normal to side of cylinder 3');
  v = new Vec3D(Math.sqrt(2), -1 * Math.sqrt(2), 23.3);
  normal = cyl.normalFn(v);
  console.log('expected: normal = (sqrt(2), -sqrt(2), 0)');
  console.log(`got normal = ${normal.toString()}`);
  console.assert(normal.near(new Vec3D(Math.sqrt(2), -1 * Math.sqrt(2), 0)));
  console.log('--------------------');

  console.log('testing intersection 1');
  let expPt = new Vec3D(-1, 0, 0);
  let rayBase = new Vec3D(-2, 0, 0);
  let rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  let t = cyl.rayIntersects(rayBase, rayDir);
  let point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (-1, 0, 0)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(new Vec3D(-1, 0, 0)));
  console.assert(normal.near(new Vec3D(-1, 0, 0)));
  console.log('----------------------');

  console.log('testing intersection 2');
  expPt = new Vec3D(-0.5 * Math.sqrt(2), -0.5 * Math.sqrt(2), -0.5);
  rayBase = new Vec3D(-2, 0, 0);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log('expected: point = (-0.707, -0.707, -0.5); normal = (-0.707, -0.707, 0)');
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(new Vec3D(-0.5 * Math.sqrt(2), -0.5 * Math.sqrt(2), 0)));
  console.log('----------------------');

  console.log('testing intersection 3');
  expPt = new Vec3D(-1, 0, 0.7);
  rayBase = new Vec3D(-2, 0, 0);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (-1, 0, 0)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(new Vec3D(-1, 0, 0.7)));
  console.assert(normal.near(new Vec3D(-1, 0, 0)));
  console.log('----------------------');

  console.log('testing intersection 4');
  expPt = new Vec3D(-0.5, -0.5 * Math.sqrt(3), -0.8);
  rayBase = new Vec3D(-2, 0, 0);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (-0.5, -0.5 * sqrt(3), -0.8)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(new Vec3D(-0.5, -0.5 * Math.sqrt(3), 0)));
  console.log('----------------------');

  console.log('testing intersection 5');
  expPt = new Vec3D(-0.5 * Math.sqrt(3), 0.5, -0.3);
  rayBase = new Vec3D(-2, 0, 0);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (-0.5 * sqrt(3), 0.5, 0)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(new Vec3D(-0.5 * Math.sqrt(3), 0.5, 0)));
  console.log('----------------------');

  console.log('testing intersection 6');
  expPt = new Vec3D(0, 0, -1);
  rayBase = new Vec3D(-2, 0, -2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, -1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(negVecK));
  console.log('----------------------');

  console.log('testing intersection 7');
  expPt = new Vec3D(0, 0, 1);
  rayBase = new Vec3D(-2, 0, 2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(vecK));
  console.log('----------------------');

  console.log('testing non intersection');
  // test cylinder with p0 = (0, 0, -1), height = 2, radius = 1, axisDir = K;
  cyl = new VerticalCylinder(
    new Vec3D(0, 0, -1),
    v => red,
    new Material(1.0, 1.0, 5),
    2,
    1,
    false,
    false
  );
  console.log(cyl.toString());
  expPt = new Vec3D(0, 0, 1);
  rayBase = new Vec3D(0, 0, 2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  console.log('expected: t = undefined');
  console.log(`got t = ${t}`);
  console.assert(!t);
  console.log('----------------------');

  console.log('testing bottom intersection from above');
  // test cylinder with p0 = (0, 0, -1), height = 2, radius = 1, axisDir = K;
  cyl = new VerticalCylinder(
    new Vec3D(0, 0, -1),
    v => red,
    new Material(1.0, 1.0, 5),
    2,
    1,
    false,
    true
  );
  console.log(cyl.toString());
  expPt = new Vec3D(0, 0, -1);
  rayBase = new Vec3D(0, 0, 2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(negVecK));
  console.log('----------------------');

  console.log('testing bottom intersection from below');
  console.log(cyl.toString());
  expPt = new Vec3D(0, 0, -1);
  rayBase = new Vec3D(0, 0, -2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(negVecK));
  console.log('----------------------');

  console.log('testing top intersection from above');
  // test cylinder with p0 = (0, 0, -1), height = 2, radius = 1, axisDir = K;
  cyl = new VerticalCylinder(
    new Vec3D(0, 0, -1),
    v => red,
    new Material(1.0, 1.0, 5),
    2,
    1,
    true,
    false
  );
  console.log(cyl.toString());
  expPt = new Vec3D(0, 0, 1);
  rayBase = new Vec3D(0, 0, 2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(vecK));
  console.log('----------------------');

  console.log('testing bottom intersection from below');
  console.log(cyl.toString());
  expPt = new Vec3D(0, 0, 1);
  rayBase = new Vec3D(0, 0, -2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = cyl.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = cyl.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(vecK));
  console.log('----------------------');

  console.log('--------------------');
  console.log('-----END OF TESTS---');
  console.log('--------------------');
 }

function test_paraboloid() {
  let parab = new Paraboloid(
    new Vec3D(0, 0, 0),
    p => (parseInt(Math.round(5 * p.z)) % 2 == 0) ? red : lightGray, // stripes
    m2,
    -1,
    -1,
    p => p.x * p.x + p.y * p.y <= 1 // disk
  );
  console.log(parab.toString());

  console.log('test normal');
  let p = new Vec3D(0, 0, 1);
  let normal = parab.normalFn(p);
  console.log('expected: normal = (0, 0, 1)');
  console.log(`got normal = ${normal.toString()}`);
  console.assert(normal.near(vecK));
  console.log('--------------------');

  console.log('testing intersection from above');
  let expPt = origin;
  let rayBase = new Vec3D(1, 0, 1);
  let rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  let t = parab.rayIntersects(rayBase, rayDir);
  let point = rayBase.plus(rayDir.scale(t));
  normal = parab.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(vecK));
  console.log('----------------------');

  console.log('testing intersection from below');
  expPt = origin;
  rayBase = new Vec3D(1, 0, -2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = parab.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = parab.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (0, 0, 1)`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(vecK));
  console.log('----------------------');

  console.log('testing intersection from below -- inside');
  expPt = new Vec3D(-0.5, 0, -0.25);
  rayBase = new Vec3D(1, 0, -2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = parab.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = parab.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (-1/sqrt(2), 0, 1/sqrt(2))`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  console.assert(normal.near(new Vec3D(-1 * Math.sqrt(2), 0, Math.sqrt(2)).toUnitVector()));
  console.log('----------------------');

  console.log('testing intersection from below -- outside');
  expPt = new Vec3D(-0.5, 0, -0.25);
  rayBase = new Vec3D(-3, 0, -2);
  rayDir = expPt.minus(rayBase).toUnitVector();
  console.log(`base = ${rayBase}; rayDir = ${rayDir}`);
  t = parab.rayIntersects(rayBase, rayDir);
  point = rayBase.plus(rayDir.scale(t));
  normal = parab.normalFn(point);
  console.log(`expected: point = ${expPt.toString()}; normal = (-1/sqrt(2), 0, 1/sqrt(2))`);
  console.log(`got point = ${point.toString()}`);
  console.log(`got normal = ${normal.toString()}`);
  console.assert(point.near(expPt));
  //console.assert(normal.near(vecK));
  console.log('----------------------');

  console.log('--------------------');
  console.log('-----END OF TESTS---');
  console.log('--------------------');
}
