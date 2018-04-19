window.addEventListener('load', () => {
  showWebGlCanvas();
});

// Global Area
const PAGE_STATE_WEBGL = 0;
const PAGE_STATE_WALL_PAINTER = 1;
let pageState = PAGE_STATE_WEBGL;
let bWebGLInited = false;
let bWallPainterInited = false;

// Wall Painter related
let wpCanvas = null;
let wpContext = null;
const placedPoints = [];//array of objects {x: ???, y: ???}
const mousePt = {
  x: 0,
  y:0
};

// Are keys pressed? Up, Right, Down, Left
const keysAreDown = [false, false, false, false];

let x = 0;

// ============================= Walls =============================
const walls = [];

// Create a wall for testing
let wallVerticies = [
  0.0 * 128 + 128, 0.5 * 96 + 96,
  -0.5 * 128 + 128, -0.5 * 96 + 96,
  0.5 * 128 + 128, 0.5 * 96 + 96,
  0.5 * 128 + 128, -0.5 * 96 + 96,
];
let wallConnectOrder = [
  0, 2, 3, 1
];
walls.push(new Wall(wallVerticies, wallConnectOrder));
wallVerticies = [
  2.1 * 128 + 128, 0.7 * 96 + 96,
  0.8 * 128 + 128, 0.8 * 96 + 96,
  1.3 * 128 + 128, 0.2 * 96 + 96,
  1.0 * 128 + 128, 0.2 * 96 + 96,
  2.1 * 128 + 128, -0.6 * 96 + 96,
  0.6 * 128 + 128, -0.9 * 96 + 96,
];
wallConnectOrder = [
  1, 0, 2, 4, 5, 3
]
walls.push(new Wall(wallVerticies, wallConnectOrder));
wallVerticies = [
  500, 400,
  600, 350,
  440, 350,
  560, 260,
  430, 200,
];
wallConnectOrder = [
  0, 1, 3, 4, 2
]
walls.push(new Wall(wallVerticies, wallConnectOrder));
wallVerticies = [
  100, 400,
  130, 365,
  80, 340,
  115, 320,
  86, 140,
  145, 220,
];
wallConnectOrder = [
  0, 1, 3, 5, 4, 2
]
walls.push(new Wall(wallVerticies, wallConnectOrder));

// console.log(walls);

// ============================= Test texture and frameBuffer =============================
const textureCoordinates = [
  0.0, 0.0,
  1.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
];

// For texture loaded from files (Upside down)
const textureCoordinatesFlipped = [
  0.0, 1.0,
  1.0, 1.0,
  0.0, 0.0,
  1.0, 0.0,
];

const textureCoordinatesPureColor = [];
for(let i = 0; i < 500; i++) {
  textureCoordinatesPureColor.push(0.0);
  textureCoordinatesPureColor.push(0.0);
}

const textureWidth = 640;
const textureHeight = 480;
let texPureColorWallGreen = null;
let texPureRedLight = null;
let texPureMainLightPikachu = null;
let tex = null;
let frameBuffer = null;
const testVerticies = [
  0, 0,
  640, 0,
  0, 480,
  640, 480,
];


const borders = [
  new LineSegment(0, 480, 640, 480),//top
  new LineSegment(640, 480, 640, 0),//right
  new LineSegment(640, 0, 0, 0),//bottom
  new LineSegment(0, 0, 0, 480),//left
];

// Textures load from files
let texBkgnd = null;
let texPikachu = null;

// Main light
let lightX = 640 / 2, lightY = 480 / 2;
// Remember to update this vertices array when light x,y changes!!!
let pikachuVertices = [
  lightX - 32, lightY - 32,
  lightX + 32, lightY - 32,
  lightX - 32, lightY + 32,
  lightX + 32, lightY + 32,
];

// A static light
let lightX1 = 40, lightY1 = 420;
let texBulbRed = null;
let bulbRedVertices = [
  lightX1 - 16, lightY1 - 16,
  lightX1 + 16, lightY1 - 16,
  lightX1 - 16, lightY1 + 16,
  lightX1 + 16, lightY1 + 16,
];

const rays = [];
const raysBulb = [];
const litAreaVertices = [];

// Methods

// ======================
// Dom Manipulation Methods
// ======================
const showWebGlCanvas = () => {
  const btn = document.getElementById('btnSwitch');
  btn.innerHTML = "Go to Wall Painter";
  pageState = PAGE_STATE_WEBGL;
  const glDiv = document.getElementById('glDiv');
  glDiv.classList.remove('hide');
  setupWebGl();
};
const hideWebGlCanvas = () => {
  const glDiv = document.getElementById('glDiv');
  glDiv.classList.add('hide');
};
const showWallPainterCanvas = () => {
  const btn = document.getElementById('btnSwitch');
  btn.innerHTML = "Go to WebGL Canvas";
  pageState = PAGE_STATE_WALL_PAINTER;
  const wpDiv = document.getElementById('wpDiv');
  const btnWp = document.getElementById('wpBtns');
  wpDiv.classList.remove('hide');
  btnWp.classList.remove('hide');
  setupWallPainterCanvas();
  wallPainterRedraw();
};
const hideWallPainterCanvas = () => {
  const wpDiv = document.getElementById('wpDiv');
  const btnWp = document.getElementById('wpBtns');
  wpDiv.classList.add('hide');
  btnWp.classList.add('hide');
}

const onSwitchClicked = () => {
  if(pageState == PAGE_STATE_WEBGL) {
    hideWebGlCanvas();
    showWallPainterCanvas();
  } else if(pageState == PAGE_STATE_WALL_PAINTER) {
    hideWallPainterCanvas();
    showWebGlCanvas();
  }
}

// Wall Painter
const setupWallPainterCanvas = () => {
  if(bWallPainterInited)
    return;
  bWallPainterInited = true;
  // TODO: Setup
  wpCanvas = document.getElementById('wpCanvas');
  wpContext = wpCanvas.getContext('2d');
};
const clearWall = () => {
  walls.length = 0;
  wallPainterRedraw();
};
const wallPainterRedraw = () => {
  // Clear
  wpContext.fillStyle = 'white';
  wpContext.fillRect(0, 0, wpCanvas.width, wpCanvas.height);

  wpContext.strokeStyle = "black";
  walls.forEach(wall => {
    wpContext.beginPath();
    // When reading y, ALWAYS subtract it from canvas height because the
    // Coordinate system of WebGL is inverted in Y compared to Canvas.
    wpContext.moveTo(
      wall.points[wall.connectIndicies[0] * 2],
      wpCanvas.height - wall.points[wall.connectIndicies[0] * 2 + 1],
    );
    for(let i = 1; i < wall.connectIndicies.length; i++) {
      wpContext.lineTo(
        wall.points[wall.connectIndicies[i] * 2],
        wpCanvas.height - wall.points[wall.connectIndicies[i] * 2 + 1]
      );
    }
    // connect to first point!
    wpContext.lineTo(
      wall.points[wall.connectIndicies[0] * 2],
      wpCanvas.height - wall.points[wall.connectIndicies[0] * 2 + 1]
    );
    wpContext.stroke();
  });

  if(placedPoints.length < 1)
    return;
  
  wpContext.strokeStyle = "black";
  const lastPt = placedPoints[placedPoints.length - 1];
  wpContext.beginPath();
  wpContext.moveTo(placedPoints[0].x, placedPoints[0].y);
  for(let i = 1; i < placedPoints.length; i++) {
    wpContext.lineTo(placedPoints[i].x, placedPoints[i].y);
  }
  wpContext.lineTo(mousePt.x, mousePt.y);
  wpContext.stroke();
}
const onWallPainterMouseDown = (evt) => {

  // Close the polygon if the point of this mouse down is very close to the first point placed
  if(placedPoints.length > 0) {
    const ptFirst = placedPoints[0];
    if(Math.abs(evt.offsetX - ptFirst.x) <= 5
      && Math.abs(evt.offsetY - ptFirst.y) <= 5 ) {
      // ignore this point and push to walls if there are 3 or more points
      let wallVertices = [];
      let toNewConnectOrderMap = [];
      let orderIndexAcc = 0;
      if(placedPoints.length > 2) {
        alert('Connected!');

        // The following code tries to split the polygon in a order
        // that satisfy the requirement of WEBGL's draw method of TRIAGNLE_STRIPS
        // However, it DOESN'T work well with Concave Polygon!!!

        ptrHead = 1;
        ptrTail = placedPoints.length - 1;
        // When saving y, ALWAYS subtract it from canvas height because the
        // Coordinate system of WebGL is inverted in Y compared to Canvas. 
        wallVertices.push(
          placedPoints[0].x, wpCanvas.height - placedPoints[0].y,
          placedPoints[ptrHead].x, wpCanvas.height - placedPoints[ptrHead].y,
          placedPoints[ptrTail].x, wpCanvas.height - placedPoints[ptrTail].y,
        );
        toNewConnectOrderMap.push(
          { oldConnectOrder: 0, connectOrder: orderIndexAcc + 0},
          { oldConnectOrder: ptrHead, connectOrder: orderIndexAcc + 1},
          { oldConnectOrder: ptrTail, connectOrder: orderIndexAcc + 2},
        );
        orderIndexAcc += 3;
        while(true) {
          ptrHead += 1;
          if(ptrHead >= ptrTail)
            break;
          wallVertices.push(placedPoints[ptrHead].x, wpCanvas.height - placedPoints[ptrHead].y);
          toNewConnectOrderMap.push({ oldConnectOrder: ptrHead, connectOrder: orderIndexAcc + 0});
          orderIndexAcc += 1;
          ptrTail -= 1;
          if(ptrHead >= ptrTail)
            break;
          wallVertices.push(placedPoints[ptrTail].x, wpCanvas.height - placedPoints[ptrTail].y);
          toNewConnectOrderMap.push({ oldConnectOrder: ptrTail, connectOrder: orderIndexAcc + 0});
          orderIndexAcc += 1;
        }
        toNewConnectOrderMap.sort((a, b) => {
          return a.oldConnectOrder - b.oldConnectOrder;
        })
        let oldConnectOrder = [];
        for(let i = 0; i < toNewConnectOrderMap.length; i++) {
          oldConnectOrder.push(toNewConnectOrderMap[i].connectOrder);
        }
        console.log(toNewConnectOrderMap);
        walls.push(new Wall(wallVertices, oldConnectOrder));
      }
      // Clear points!
      placedPoints.length = 0;
      wallPainterRedraw();
      return;
    }
  }

  placedPoints.push({
    x: evt.offsetX,
    y: evt.offsetY,
  });
  
};
const onWallPainterMouseMove = (evt) => {
  mousePt.x = evt.offsetX;
  mousePt.y = evt.offsetY;
  wallPainterRedraw();
};
//
// start here
//
const setupWebGl = () => {
  // Initialize only once!
  if(bWebGLInited)
    return;
  bWebGLInited = true;

  const canvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Call this utility function defined at the end of this file
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  const bf = initBuffers(gl);

  texBkgnd = loadTexture(gl, './bkgnd.png');
  texPikachu = loadTexture(gl, './pi.png');
  texBulbRed = loadTexture(gl, './bulb.png');

  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  texPureColor = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texPureColor);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPureColor, 0);
  
  // Render to texture
  gl.clearColor(0, 0.6, 0.6, 1.0); // dark green. Used to draw walls;
  gl.clear(gl.COLOR_BUFFER_BIT);

  texPureRedLight = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texPureRedLight);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPureRedLight, 0);
  // Render to texture
  gl.clearColor(1, 0, 0, 0.3); // red;
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Main Light Source(Bind to pikachu)
  texPureMainLightPikachu = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texPureMainLightPikachu);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPureMainLightPikachu, 0);
  // Render to texture
  gl.clearColor(1, 0, 0, 0.73); // white;
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);


  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);


  requestAnimationFrame(() => drawScene(gl, programInfo, bf));

  // // Set clear color to black, fully opaque
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // // Clear the color buffer with specified clear color
  // gl.clear(gl.COLOR_BUFFER_BIT);
}

// ==============================================================
//  private functions
// ==============================================================

// create a buffer (square)
const initBuffers = (gl) => {

  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();
  const textureCoordBuffer = gl.createBuffer();

  // // Select the positionBuffer as the one to apply buffer
  // // operations to from here out.
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // // Now pass the list of positions into WebGL to build the
  // // shape. We do this by creating a Float32Array from the
  // // JavaScript array, then use it to fill the current buffer.
  // gl.bufferData(gl.ARRAY_BUFFER,
  //               // new Float32Array(positions),
  //               new Float32Array(walls[0].points),
  //               gl.STATIC_DRAW);

  // gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  // gl.bufferData(gl.ARRAY_BUFFER,
  //               new Float32Array(textureCoordinates),
  //               gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
  };
}

// intersection test
// const a = new LineSegment(0, 480, 640, 0);
// const b = new LineSegment(0, 0, 640, 480);
// console.log(a.theta * 180 / Math.PI);
// console.log(b.theta * 180 / Math.PI);
// console.log(a.intersectionTest(b));

// let testFlag = true;
const drawScene = (gl, programInfo, buffers) => {

  // Test: -----------------------------------------------------------------
  // Create Rays from the light source to all verticies of the walls.
  // Save them in a list and then sort based on theta.
  rays.length = 0;//clear array the js way
  walls.forEach(wall => {
    for(let i = 0; i + 1 < wall.points.length; i += 2) {
      const ray = new LineSegment(lightX, lightY, wall.points[i], wall.points[i + 1]);
      rays.push(ray);
      // Extra rays (+-0.0001 Radians to cast rays through side corners)
      rays.push(new LineSegment(lightX, lightY, ray.theta - 0.0001));
      rays.push(new LineSegment(lightX, lightY, ray.theta + 0.0001));
    }
  });
  borders.forEach(border => {
    const ray = new LineSegment(lightX, lightY, border.ptStartX, border.ptStartY);
    rays.push(ray);
  })
  // sort rays based on angle so that later we can genrate verticies of lit area following this order
  rays.sort((a, b) => {
    return a.theta - b.theta;
  });

  let minRetSoFar = 0;
  litAreaVertices.length = 0;// clear vertices array
  lastPt = null;
  let firstPtX = 0;
  let firstPtY = 0;

  rays.forEach(ray => {
    minRetSoFar = 1000000;
    walls.forEach(wall => {
      wall.LineSegments.forEach(ls => {
        let ret = ray.intersectionTest(ls);
        if(ret === null)
          return;
        if(ret < minRetSoFar) {
          minRetSoFar = ret;
        }
      });
    });
    borders.forEach(border => {
      let ret = ray.intersectionTest(border);
      if(ret === null)
        return;
      if(ret < minRetSoFar) {
        minRetSoFar = ret;
      }
    });

    // if(testFlag)
    //   console.log(minRetSoFar);
    // Calculate the intersection point
    if(lastPt === null) {
      lastPt = {
        x: ray.ptStartX + minRetSoFar * Math.cos(ray.theta),
        y: ray.ptStartY + minRetSoFar * Math.sin(ray.theta),
      }
      firstPtX = lastPt.x;
      firstPtY = lastPt.y;
    } else {
      // To form a triangle.
      litAreaVertices.push(lastPt.x);
      litAreaVertices.push(lastPt.y);
      litAreaVertices.push(lightX);
      litAreaVertices.push(lightY);
      lastPt.x = ray.ptStartX + minRetSoFar * Math.cos(ray.theta);
      lastPt.y = ray.ptStartY + minRetSoFar * Math.sin(ray.theta);
      litAreaVertices.push(lastPt.x);
      litAreaVertices.push(lastPt.y);
    }
    // litAreaVertices.push(lastPt.x);
    // litAreaVertices.push(lastPt.y);
  });
  litAreaVertices.push(lastPt.x);
  litAreaVertices.push(lastPt.y);
  litAreaVertices.push(lightX);
  litAreaVertices.push(lightY);
  litAreaVertices.push(firstPtX);
  litAreaVertices.push(firstPtY);
  // if(testFlag) {
  //   console.log(litAreaVertices);
  //   testFlag = false;
  // }


  gl.clearColor(0.0, 0.0, 1.0, 1.0);
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  // gl.viewport(0, 0, textureWidth, textureHeight);

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.

  // DO NOT USE PERSPECTIVE. YOU CAN'T DRAW A FULL SCREEN QUARD OTHERWISE
  // mat4.perspective(projectionMatrix,
  //                  fieldOfView,
  //                  aspect,
  //                  zNear,
  //                  zFar);
  mat4.ortho(projectionMatrix, 0, gl.canvas.clientWidth, 0, gl.canvas.clientHeight, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);

    // And colors as well
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(
      programInfo.attribLocations.textureCoord
    );
  }

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

    // Draw background image
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(testVerticies), gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, texBkgnd);
    // bind texture coord to the screen texture
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(textureCoordinatesFlipped),
                gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // draw lit area ----
    // draw to texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    gl.clearColor(0.0, 0.0, 0.0, 0.85);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
    
    gl.bindTexture(gl.TEXTURE_2D, texPureMainLightPikachu);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(textureCoordinatesPureColor),
                gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(litAreaVertices), gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, litAreaVertices.length / 2);

    // ============================= TEST: Another Light Source - A red light=============================

    raysBulb.length = 0;//clear array the js way
      walls.forEach(wall => {
        for(let i = 0; i + 1 < wall.points.length; i += 2) {
          const ray = new LineSegment(lightX1, lightY1, wall.points[i], wall.points[i + 1]);
          raysBulb.push(ray);
          // Extra rays (+-0.0001 Radians to cast rays through side corners)
          raysBulb.push(new LineSegment(lightX1, lightY1, ray.theta - 0.0001));
          raysBulb.push(new LineSegment(lightX1, lightY1, ray.theta + 0.0001));
        }
      });
      borders.forEach(border => {
        const ray = new LineSegment(lightX1, lightY1, border.ptStartX, border.ptStartY);
        raysBulb.push(ray);
      })
      // sort rays based on angle so that later we can genrate verticies of lit area following this order
      raysBulb.sort((a, b) => {
        return a.theta - b.theta;
      });

      minRetSoFar = 0;
      litAreaVertices.length = 0;// clear vertices array
      lastPt = null;
      firstPtX = 0;
      firstPtY = 0;

      raysBulb.forEach(ray => {
        minRetSoFar = 1000000;
        walls.forEach(wall => {
          wall.LineSegments.forEach(ls => {
            let ret = ray.intersectionTest(ls);
            if(ret === null)
              return;
            if(ret < minRetSoFar) {
              minRetSoFar = ret;
            }
          });
        });
        borders.forEach(border => {
          let ret = ray.intersectionTest(border);
          if(ret === null)
            return;
          if(ret < minRetSoFar) {
            minRetSoFar = ret;
          }
        });

        // if(testFlag)
        //   console.log(minRetSoFar);
        // Calculate the intersection point
        if(lastPt === null) {
          lastPt = {
            x: ray.ptStartX + minRetSoFar * Math.cos(ray.theta),
            y: ray.ptStartY + minRetSoFar * Math.sin(ray.theta),
          }
          firstPtX = lastPt.x;
          firstPtY = lastPt.y;
        } else {
          // To form a triangle.
          litAreaVertices.push(lastPt.x);
          litAreaVertices.push(lastPt.y);
          litAreaVertices.push(lightX1);
          litAreaVertices.push(lightY1);
          lastPt.x = ray.ptStartX + minRetSoFar * Math.cos(ray.theta);
          lastPt.y = ray.ptStartY + minRetSoFar * Math.sin(ray.theta);
          litAreaVertices.push(lastPt.x);
          litAreaVertices.push(lastPt.y);
        }
        // litAreaVertices.push(lastPt.x);
        // litAreaVertices.push(lastPt.y);
      });
      litAreaVertices.push(lastPt.x);
      litAreaVertices.push(lastPt.y);
      litAreaVertices.push(lightX1);
      litAreaVertices.push(lightY1);
      litAreaVertices.push(firstPtX);
      litAreaVertices.push(firstPtY);

      gl.bindTexture(gl.TEXTURE_2D, texPureRedLight);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(textureCoordinatesPureColor),
                  gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(litAreaVertices), gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, litAreaVertices.length / 2);

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.blendEquation(gl.FUNC_ADD);
      gl.drawArrays(gl.TRIANGLES, 0, litAreaVertices.length / 2);

    // ================================================================================

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);

    // Draw red lines(For showing how lit area is drawn)
    // gl.drawArrays(gl.LINE_STRIP, 0, litAreaVertices.length / 2);

    // Draw texture to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // bind texture coord to the screen texture
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(testVerticies), gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Draw walls
    {
      gl.bindTexture(gl.TEXTURE_2D, texPureColor);
      // bind texture coord of pure color texture
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(textureCoordinatesPureColor),
                  gl.STATIC_DRAW);
  
      for(let i = 0; i < walls.length; i++) {
        const offset = 0;
        // const vertexCount = 4;
        const vertexCount = walls[i].points.length / 2;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER,
          new Float32Array(walls[i].points),
          gl.STATIC_DRAW
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  
        // update
        // x += 0.005;
        // if(x >= Math.PI * 2)
        //   x = 0;
        // lightX = 640 / 2 + Math.cos(x) * 200
      }

      // update Pikachu position based on key states
      if(keysAreDown[0]) {
        lightY += 3;
      }
      if(keysAreDown[1]) {
        lightX += 3;
      }
      if(keysAreDown[2]) {
        lightY -= 3;
      }
      if(keysAreDown[3]) {
        lightX -= 3;
      }

      // boundary check
      if(lightX < 1) {
        lightX = 1;
      }
      if(lightX > 639) {
        lightX = 639;
      }
      if(lightY < 1) {
        lightY = 1;
      }
      if(lightY > 479) {
        lightY = 479;
      }
      pikachuVertices = [
      lightX - 32, lightY - 32,
      lightX + 32, lightY - 32,
      lightX - 32, lightY + 32,
      lightX + 32, lightY + 32,
      ];

      // Draw red bulb
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bulbRedVertices), gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D, texBulbRed);
      // bind texture coord to the screen texture
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(textureCoordinatesFlipped),
                  gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Finially draw pikachu
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pikachuVertices), gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D, texPikachu);
      // bind texture coord to the screen texture
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(textureCoordinatesFlipped),
                  gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  requestAnimationFrame(() => drawScene(gl, programInfo, buffers));
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
const initShaderProgram = (gl, vsSource, fsSource) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
};

// Vertex shader program
const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;

// Fragment shader program
const fsSource = `
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

// --------------------------- Key event listeners 
window.addEventListener('keydown', (event) => {
  if(event.key == 'ArrowUp') {
    keysAreDown[0] = true;
  }
  if(event.key == 'ArrowRight') {
    keysAreDown[1] = true;
  }
  if(event.key == 'ArrowDown') {
    keysAreDown[2] = true;
  }
  if(event.key == 'ArrowLeft') {
    keysAreDown[3] = true;
  }
});
window.addEventListener('keyup', (event) => {
  if(event.key == 'ArrowUp') {
    keysAreDown[0] = false;
  }
  if(event.key == 'ArrowRight') {
    keysAreDown[1] = false;
  }
  if(event.key == 'ArrowDown') {
    keysAreDown[2] = false;
  }
  if(event.key == 'ArrowLeft') {
    keysAreDown[3] = false;
  }
});

// =========== For data visualization ===========
// Utility functions:
const round = (value, decimals) => {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
};


const printWalls = () => {
  let str = '';
  walls.forEach(wall => {
    wall.LineSegments.forEach(ls => {
      str += `(${round(ls.ptStartX, 2)}, ${round(ls.ptStartY, 2)}) => (${round(ls.ptEndX, 2)}, ${round(ls.ptEndY, 2)})<br>`;
    });
    let x = 3;
    let y = 2;
  });
  return str;
};

const printRayOfLightMain = () => {
  let str = '';
  rays.forEach(ray => {
    str += `starts = (${round(ray.ptStartX, 2)}, ${round(ray.ptStartY, 2)}), length = ${round(ray.length, 2)}, theta = ${round(ray.theta, 2)}<br>`;
  });
  return str;
};

const printRayOfLightBulb = () => {
  let str = '';
  raysBulb.forEach(ray => {
    str += `starts = (${round(ray.ptStartX, 2)}, ${round(ray.ptStartY, 2)}), length = ${round(ray.length, 2)}, theta = ${round(ray.theta, 2)}<br>`;
  });
  return str;
};
