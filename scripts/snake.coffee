
requestAnimFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (c) -> window.setTimeout(c, 15)

ANGLE_D = 5

$(window).on "load", ->
  canvas = $('#canvas').get(0)
  renderer = new Phoria.CanvasRenderer(canvas)
  scene = new Phoria.Scene()
  scene.camera.position = {x:-10.0, y:15.0, z:-15.0}
  scene.perspective.aspect = canvas.width / canvas.height
  scene.viewport.width = canvas.width
  scene.viewport.height = canvas.height

  # mouse rotation and position tracking
  mouse = Phoria.View.addMouseEvents(canvas);
   
  # keep track of rotation
  rot =
    x: 0, y: 0, z: 0,
    velx: 0, vely: 0, velz: 0,
    nowx: 0, nowy: 0, nowz: 0,
    ratio: 0.1

  draw = (formula) ->
    scene.graph = []

    # add a grid to help visualise camera position etc.
    plane = Phoria.Util.generateTesselatedPlane(8,8,0,20)
    scene.graph.push Phoria.Entity.create
      points: plane.points
      edges: plane.edges
      polygons: plane.polygons
      style:
        shademode: "plain"
        drawmode: "wireframe"
        linewidth: 0.5
        objectsortmode: "back"

    # add prisms
    sideA = 1.2
    sideB = Math.sqrt(sideA**2 / 2)
    halfSideA = sideA / 2
    halfSideB = sideB / 2
    height = Math.sqrt(sideB**2 - (sideA/2)**2)
    
    halfHeight = height / 2
    prisms = for i in [0...24]
      points1 =
        [ 
          { x: -14*halfSideA + (i-1)*halfSideA, y: -halfHeight, z: halfSideB }
          { x: -14*halfSideA + i*halfSideA, y: halfHeight,  z: halfSideB }
          { x: -14*halfSideA + (i+1)*halfSideA , y: -halfHeight, z: halfSideB }
        ]
      points2 = for point in points1
        {
          x: point.x
          y: point.y
          z: point.z - sideB
        }
      points = [points1..., points2...]
      
      if i %% 2 == 1
        for point in points
          point.y = -point.y
        points.reverse()


      edges = [
        { a: 0, b: 1 }
        { a: 1, b: 2 }
        { a: 2, b: 0 }
        { a: 3, b: 4 }
        { a: 4, b: 5 }
        { a: 5, b: 3 }
        { a: 0, b: 3 }
        { a: 1, b: 4 }
        { a: 2, b: 5 }
      ]

      polygons = [
        { vertices: [0, 1, 2] }
        { vertices: [5, 4, 3] }
        { vertices: [0, 3, 4, 1] } # [2] - left sloping side
        { vertices: [1, 4, 5, 2] } # [3] - right sloping side
        { vertices: [0, 2, 5, 3] }
      ]

      prism = Phoria.Entity.create
        points: points
        edges: edges
        polygons: polygons
        style:
          color: if i %% 2 == 0 then [127, 0, 127] else [102,230,188]
          shademode: "lightsource"
          linewidth: 1
          linescale: 0
          drawmode: "wireframe"
          opacity: 0.98
          objectsortmode: "back"
      prism
      # prism.translateX(-sideA*12)

    for prism in prisms
      prism.generatePolygonNormals()
      prism.leftNormal = vec3.clone(prism.polygons[2].normal)
      prism.rightNormal = vec3.clone(prism.polygons[3].normal)

    scene.graph.push prism for prism in prisms

    # add a light
    scene.graph.push Phoria.DistantLight.create
      direction: {x:0, y:-0.5, z:1}

    makeTurn = (code, cbDone) ->
      n = parseInt(code[0])
      # TODO: check NaN
      # TODO: check 1 <= n <= 12
      [n, nRotates] = code.split(/L|R/)
      direction = code.match(/L|R/)[0]
      # TODO: check NaN
      # TODO: check 1 <= nRotates < 4
      # nRotates = -1 if nRotates == "3"
      angle = 90*nRotates

      index = (n - 1) * 2
      middlePrism = prisms[index]
      [normal, slopingSide] = if direction == "L"
        [middlePrism.leftNormal, middlePrism.polygons[2]]
      else if direction == "R"
        [middlePrism.rightNormal, middlePrism.polygons[3]]

      p1 = middlePrism.points[slopingSide.vertices[0]]
      p2 = middlePrism.points[slopingSide.vertices[2]]
      transVector = vec3.fromValues((p1.x+p2.x)/2, (p1.y+p2.y)/2, (p1.z+p2.z)/2)
      transVector = vec3.transformMat4(transVector, transVector, middlePrism.matrix)
      transBackVector = vec3.negate(vec3.create(), transVector)

      axis = vec3.clone(normal)

      angleDelta = ANGLE_D*Phoria.RADIANS
      angleDelta = -angleDelta if direction == "R"

      q = quat.setAxisAngle(quat.create(), axis, angleDelta)
      mq = mat4.fromRotationTranslation(mat4.create(), q, transVector)
      mq = mat4.translate(mq, mq, transBackVector)

      prismSubset = if direction == "L"
        prisms[0...index]
      else
        prisms[index+1...24]

      currentAngle = 0

      doRotate = (prism) -> # TODO: make as prism method
        vec4.transformQuat(prism.leftNormal, prism.leftNormal, q)
        vec4.transformQuat(prism.rightNormal, prism.rightNormal, q)
        mat4.mul(prism.matrix, mq, prism.matrix) # world axis

      doRotateAll = () ->
        for prism in prismSubset
          doRotate(prism)

        currentAngle += ANGLE_D

        if currentAngle < angle
          setTimeout doRotateAll, 1
        else
          setTimeout cbDone, 0

      setTimeout doRotateAll, 0

    turns = formula.split(/\r\n|\n\r|\n|\r/).join("").split("-").reverse()
    nextStep = () ->
      setTimeout ->
        turn = turns.pop()
        if turn
          makeTurn turn, nextStep
      ,10
    setTimeout nextStep, 0

    fnAnimate = ->
      rot.nowx += (rot.velx = (mouse.velocityV - rot.x - rot.nowx) * rot.ratio)
      rot.nowy += (rot.vely = (rot.y - rot.nowy) * rot.ratio)
      rot.nowz += (rot.velz = (mouse.velocityH - rot.z - rot.nowz) * rot.ratio)

      qx = quat.setAxisAngle(quat.create(), vec3.fromValues(1,0,0), -rot.velx*Phoria.RADIANS)
      mx = mat4.fromQuat(mat4.create(), qx)
      qy = quat.setAxisAngle(quat.create(), vec3.fromValues(0,1,0), -rot.vely*Phoria.RADIANS)
      my = mat4.fromQuat(mat4.create(), qy)
      qz = quat.setAxisAngle(quat.create(), vec3.fromValues(0,0,1), -rot.velz*Phoria.RADIANS)
      mz = mat4.fromQuat(mat4.create(), qz)

      scene.camera.position.x -= rot.velx/4
      scene.camera.position.y -= rot.vely/4
      scene.camera.position.z -= rot.velz/4

      scene.modelView()
      renderer.render(scene)
      requestAnimFrame(fnAnimate)

    requestAnimFrame(fnAnimate)

  # add GUI controls
  gui = new dat.GUI()
  f = gui.addFolder('Perspective')
  f.add(scene.perspective, "fov").min(5).max(175)
  f.add(scene.perspective, "near").min(1).max(100)
  f.add(scene.perspective, "far").min(1).max(1000)
  # f.open()
  f = gui.addFolder('Camera LookAt')
  f.add(scene.camera.lookat, "x").min(-100).max(100)
  f.add(scene.camera.lookat, "y").min(-100).max(100)
  f.add(scene.camera.lookat, "z").min(-100).max(100)
  f.open()
  f = gui.addFolder('Camera Position');
  f.add(scene.camera.position, "x").min(-100).max(100)
  f.add(scene.camera.position, "y").min(-100).max(100)
  f.add(scene.camera.position, "z").min(-100).max(100)
  f.open()
  f = gui.addFolder('Camera Up');
  f.add(scene.camera.up, "x").min(-10).max(10).step(0.1)
  f.add(scene.camera.up, "y").min(-10).max(10).step(0.1)
  f.add(scene.camera.up, "z").min(-10).max(10).step(0.1)
  # f = gui.addFolder('Spin Local Axis (or use mouse)')
  # f.add(rot, "x").min(-180).max(180)
  # f.add(rot, "y").min(-180).max(180)
  # f.add(rot, "z").min(-180).max(180)
  # f.open()

  draw("9R2-9L2-8L2-7R2-6R2-6L2-5L3-4L2-
3R2-2R2-2L2")

  $("#drawButton").click (e) ->
    e.preventDefault()
    draw($("#formula").val())
  $("#buttonCat").click (e) ->
    e.preventDefault()
    formula = "9R2-9L2-8L2-7R2-6R2-6L2-5L3-4L2-3R2-2R2-2L2"
    $("#formula").val(formula)
    draw(formula)
  $("#buttonWolf").click (e) ->
    e.preventDefault()
    formula = "2R2-3L2-4L2-5R2-6R2-7L2-8L2-10L2-10R2-12R2"
    $("#formula").val(formula)
    draw(formula)
  $("#buttonTerrier").click (e) ->
    e.preventDefault()
    formula = "1R2-2R2-3L2-4L2-6L2-6R2-7R2-9L2-10L2-10R2"
    $("#formula").val(formula)
    draw(formula)
  $("#buttonCook").click (e) ->
    e.preventDefault()
    formula = "2R2-3L2-4L3-5L3-5R3-7R2-8L2-9L1-6R3-6L2-10L1-9R2-10R1-11R1-12R2"
    $("#formula").val(formula)
    draw(formula)
  $("#buttonPropeller").click (e) ->
    e.preventDefault()
    formula = "3L3-4L1-4R1-5L1-7L3-8L1-8R1-11L3-9L1-12L1-12R1"
    $("#formula").val(formula)
    draw(formula)
  $("#buttonSnowflake").click (e) ->
    e.preventDefault()
    formula = "1R3-2L1-2R3-3L3-3R1-4L3-4R1-5L1-5R3-6L1-6R3-7L3-7R1-8L3-8R1-9L1-9R3-10L1-10R3-12L3-11R1-11L3-12R"
    $("#formula").val(formula)
    draw(formula)
  $("#buttonBow").click (e) ->
    e.preventDefault()
    formula = "1R3-2L1-2R3-3L3-4R1-4L3-3R3-5L3-5R3-6L1-6R3-9L3-8R1-8L3-7R3-7L3-9R3-10L1-12R1-12L3-11R3-11L3-10R3"
    $("#formula").val(formula)
    draw(formula)
    
