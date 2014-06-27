// Generated by CoffeeScript 1.7.1
var ANGLE_D, requestAnimFrame,
  __slice = [].slice,
  __modulo = function(a, b) { return (a % b + +b) % b; };

requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(c) {
  return window.setTimeout(c, 15);
};

ANGLE_D = 5;

$(window).on("load", function() {
  var canvas, draw, f, gui, mouse, renderer, rot, scene;
  canvas = $('#canvas').get(0);
  renderer = new Phoria.CanvasRenderer(canvas);
  scene = new Phoria.Scene();
  scene.camera.position = {
    x: -10.0,
    y: 15.0,
    z: -15.0
  };
  scene.perspective.aspect = canvas.width / canvas.height;
  scene.viewport.width = canvas.width;
  scene.viewport.height = canvas.height;
  mouse = Phoria.View.addMouseEvents(canvas);
  rot = {
    x: 0,
    y: 0,
    z: 0,
    velx: 0,
    vely: 0,
    velz: 0,
    nowx: 0,
    nowy: 0,
    nowz: 0,
    ratio: 0.1
  };
  draw = function(formula) {
    var edges, fnAnimate, halfHeight, halfSideA, halfSideB, height, i, makeTurn, nextStep, plane, point, points, points1, points2, polygons, prism, prisms, sideA, sideB, turns, _i, _j, _len, _len1;
    scene.graph = [];
    plane = Phoria.Util.generateTesselatedPlane(8, 8, 0, 20);
    scene.graph.push(Phoria.Entity.create({
      points: plane.points,
      edges: plane.edges,
      polygons: plane.polygons,
      style: {
        shademode: "plain",
        drawmode: "wireframe",
        linewidth: 0.5,
        objectsortmode: "back"
      }
    }));
    sideA = 1.2;
    sideB = Math.sqrt(Math.pow(sideA, 2) / 2);
    halfSideA = sideA / 2;
    halfSideB = sideB / 2;
    height = Math.sqrt(Math.pow(sideB, 2) - Math.pow(sideA / 2, 2));
    halfHeight = height / 2;
    prisms = (function() {
      var _i, _j, _len, _results;
      _results = [];
      for (i = _i = 0; _i < 24; i = ++_i) {
        points1 = [
          {
            x: -14 * halfSideA + (i - 1) * halfSideA,
            y: -halfHeight,
            z: halfSideB
          }, {
            x: -14 * halfSideA + i * halfSideA,
            y: halfHeight,
            z: halfSideB
          }, {
            x: -14 * halfSideA + (i + 1) * halfSideA,
            y: -halfHeight,
            z: halfSideB
          }
        ];
        points2 = (function() {
          var _j, _len, _results1;
          _results1 = [];
          for (_j = 0, _len = points1.length; _j < _len; _j++) {
            point = points1[_j];
            _results1.push({
              x: point.x,
              y: point.y,
              z: point.z - sideB
            });
          }
          return _results1;
        })();
        points = __slice.call(points1).concat(__slice.call(points2));
        if (__modulo(i, 2) === 1) {
          for (_j = 0, _len = points.length; _j < _len; _j++) {
            point = points[_j];
            point.y = -point.y;
          }
          points.reverse();
        }
        edges = [
          {
            a: 0,
            b: 1
          }, {
            a: 1,
            b: 2
          }, {
            a: 2,
            b: 0
          }, {
            a: 3,
            b: 4
          }, {
            a: 4,
            b: 5
          }, {
            a: 5,
            b: 3
          }, {
            a: 0,
            b: 3
          }, {
            a: 1,
            b: 4
          }, {
            a: 2,
            b: 5
          }
        ];
        polygons = [
          {
            vertices: [0, 1, 2]
          }, {
            vertices: [5, 4, 3]
          }, {
            vertices: [0, 3, 4, 1]
          }, {
            vertices: [1, 4, 5, 2]
          }, {
            vertices: [0, 2, 5, 3]
          }
        ];
        prism = Phoria.Entity.create({
          points: points,
          edges: edges,
          polygons: polygons,
          style: {
            color: __modulo(i, 2) === 0 ? [127, 0, 127] : [102, 230, 188],
            shademode: "lightsource",
            linewidth: 1,
            linescale: 0,
            drawmode: "wireframe",
            opacity: 0.98,
            objectsortmode: "back"
          }
        });
        _results.push(prism);
      }
      return _results;
    })();
    for (_i = 0, _len = prisms.length; _i < _len; _i++) {
      prism = prisms[_i];
      prism.generatePolygonNormals();
      prism.leftNormal = vec3.clone(prism.polygons[2].normal);
      prism.rightNormal = vec3.clone(prism.polygons[3].normal);
    }
    for (_j = 0, _len1 = prisms.length; _j < _len1; _j++) {
      prism = prisms[_j];
      scene.graph.push(prism);
    }
    scene.graph.push(Phoria.DistantLight.create({
      direction: {
        x: 0,
        y: -0.5,
        z: 1
      }
    }));
    makeTurn = function(code, cbDone) {
      var angle, angleDelta, axis, currentAngle, direction, doRotate, doRotateAll, index, middlePrism, mq, n, nRotates, normal, p1, p2, prismSubset, q, slopingSide, transBackVector, transVector, _ref, _ref1;
      n = parseInt(code[0]);
      _ref = code.split(/L|R/), n = _ref[0], nRotates = _ref[1];
      direction = code.match(/L|R/)[0];
      angle = 90 * nRotates;
      index = (n - 1) * 2;
      middlePrism = prisms[index];
      _ref1 = direction === "L" ? [middlePrism.leftNormal, middlePrism.polygons[2]] : direction === "R" ? [middlePrism.rightNormal, middlePrism.polygons[3]] : void 0, normal = _ref1[0], slopingSide = _ref1[1];
      p1 = middlePrism.points[slopingSide.vertices[0]];
      p2 = middlePrism.points[slopingSide.vertices[2]];
      transVector = vec3.fromValues((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
      transVector = vec3.transformMat4(transVector, transVector, middlePrism.matrix);
      transBackVector = vec3.negate(vec3.create(), transVector);
      axis = vec3.clone(normal);
      angleDelta = ANGLE_D * Phoria.RADIANS;
      if (direction === "R") {
        angleDelta = -angleDelta;
      }
      q = quat.setAxisAngle(quat.create(), axis, angleDelta);
      mq = mat4.fromRotationTranslation(mat4.create(), q, transVector);
      mq = mat4.translate(mq, mq, transBackVector);
      prismSubset = direction === "L" ? prisms.slice(0, index) : prisms.slice(index + 1, 24);
      currentAngle = 0;
      doRotate = function(prism) {
        vec4.transformQuat(prism.leftNormal, prism.leftNormal, q);
        vec4.transformQuat(prism.rightNormal, prism.rightNormal, q);
        return mat4.mul(prism.matrix, mq, prism.matrix);
      };
      doRotateAll = function() {
        var _k, _len2;
        for (_k = 0, _len2 = prismSubset.length; _k < _len2; _k++) {
          prism = prismSubset[_k];
          doRotate(prism);
        }
        currentAngle += ANGLE_D;
        if (currentAngle < angle) {
          return setTimeout(doRotateAll, 1);
        } else {
          return setTimeout(cbDone, 0);
        }
      };
      return setTimeout(doRotateAll, 0);
    };
    turns = formula.split(/\r\n|\n\r|\n|\r/).join("").split("-").reverse();
    nextStep = function() {
      return setTimeout(function() {
        var turn;
        turn = turns.pop();
        if (turn) {
          return makeTurn(turn, nextStep);
        }
      }, 10);
    };
    setTimeout(nextStep, 0);
    fnAnimate = function() {
      var mx, my, mz, qx, qy, qz;
      rot.nowx += (rot.velx = (mouse.velocityV - rot.x - rot.nowx) * rot.ratio);
      rot.nowy += (rot.vely = (rot.y - rot.nowy) * rot.ratio);
      rot.nowz += (rot.velz = (mouse.velocityH - rot.z - rot.nowz) * rot.ratio);
      qx = quat.setAxisAngle(quat.create(), vec3.fromValues(1, 0, 0), -rot.velx * Phoria.RADIANS);
      mx = mat4.fromQuat(mat4.create(), qx);
      qy = quat.setAxisAngle(quat.create(), vec3.fromValues(0, 1, 0), -rot.vely * Phoria.RADIANS);
      my = mat4.fromQuat(mat4.create(), qy);
      qz = quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), -rot.velz * Phoria.RADIANS);
      mz = mat4.fromQuat(mat4.create(), qz);
      scene.camera.position.x -= rot.velx / 4;
      scene.camera.position.y -= rot.vely / 4;
      scene.camera.position.z -= rot.velz / 4;
      scene.modelView();
      renderer.render(scene);
      return requestAnimFrame(fnAnimate);
    };
    return requestAnimFrame(fnAnimate);
  };
  gui = new dat.GUI();
  f = gui.addFolder('Perspective');
  f.add(scene.perspective, "fov").min(5).max(175);
  f.add(scene.perspective, "near").min(1).max(100);
  f.add(scene.perspective, "far").min(1).max(1000);
  f = gui.addFolder('Camera LookAt');
  f.add(scene.camera.lookat, "x").min(-100).max(100);
  f.add(scene.camera.lookat, "y").min(-100).max(100);
  f.add(scene.camera.lookat, "z").min(-100).max(100);
  f.open();
  f = gui.addFolder('Camera Position');
  f.add(scene.camera.position, "x").min(-100).max(100);
  f.add(scene.camera.position, "y").min(-100).max(100);
  f.add(scene.camera.position, "z").min(-100).max(100);
  f.open();
  f = gui.addFolder('Camera Up');
  f.add(scene.camera.up, "x").min(-10).max(10).step(0.1);
  f.add(scene.camera.up, "y").min(-10).max(10).step(0.1);
  f.add(scene.camera.up, "z").min(-10).max(10).step(0.1);
  draw("9R2-9L2-8L2-7R2-6R2-6L2-5L3-4L2- 3R2-2R2-2L2");
  $("#drawButton").click(function(e) {
    e.preventDefault();
    return draw($("#formula").val());
  });
  $("#buttonCat").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "9R2-9L2-8L2-7R2-6R2-6L2-5L3-4L2-3R2-2R2-2L2";
    $("#formula").val(formula);
    return draw(formula);
  });
  $("#buttonWolf").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "2R2-3L2-4L2-5R2-6R2-7L2-8L2-10L2-10R2-12R2";
    $("#formula").val(formula);
    return draw(formula);
  });
  $("#buttonTerrier").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "1R2-2R2-3L2-4L2-6L2-6R2-7R2-9L2-10L2-10R2";
    $("#formula").val(formula);
    return draw(formula);
  });
  $("#buttonCook").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "2R2-3L2-4L3-5L3-5R3-7R2-8L2-9L1-6R3-6L2-10L1-9R2-10R1-11R1-12R2";
    $("#formula").val(formula);
    return draw(formula);
  });
  $("#buttonPropeller").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "3L3-4L1-4R1-5L1-7L3-8L1-8R1-11L3-9L1-12L1-12R1";
    $("#formula").val(formula);
    return draw(formula);
  });
  $("#buttonSnowflake").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "1R3-2L1-2R3-3L3-3R1-4L3-4R1-5L1-5R3-6L1-6R3-7L3-7R1-8L3-8R1-9L1-9R3-10L1-10R3-12L3-11R1-11L3-12R";
    $("#formula").val(formula);
    return draw(formula);
  });
  return $("#buttonBow").click(function(e) {
    var formula;
    e.preventDefault();
    formula = "1R3-2L1-2R3-3L3-4R1-4L3-3R3-5L3-5R3-6L1-6R3-9L3-8R1-8L3-7R3-7L3-9R3-10L1-12R1-12L3-11R3-11L3-10R3";
    $("#formula").val(formula);
    return draw(formula);
  });
});
