const EPS = 10e-6;

/**
 * Pen tool
 * @component pen
 */

import SharedBufferGeometryManager from "../../vendor/sharedbuffergeometrymanager";

AFRAME.registerComponent("pen", {
  schema: {
    drawPoints: { default: [] },
    drawFrequency: { default: 100 },
    minDistanceBetweenPoints: { default: 0.05 },
    defaultDirection: { default: { x: 1, y: 0, z: 0 } },
    segments: { default: 8 },
    radius: { default: 0.02 },
    debug: { default: false },
    camera: { type: "selector" }
  },

  init() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xff0000 });

    this.sharedBufferGeometryManager = new SharedBufferGeometryManager();
    this.sharedBufferGeometryManager.addSharedBuffer(0, material, THREE.TriangleStripDrawMode);

    this.isDrawing = false;
    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPosition.copy(this.el.object3D.position);
    this.direction = new THREE.Vector3();
    this.direction.copy(this.data.defaultDirection);

    this.lastPoint = new THREE.Vector3();
    this.lastPointSet = false;
    this.initialized = false;

    this.lastSegments = [];
    this.currentSegments = [];
    for (var x = 0; x < this.data.segments; x++) {
      this.lastSegments[x] = new THREE.Vector3();
      this.currentSegments[x] = new THREE.Vector3();
    }

    this.sharedBuffer = this.sharedBufferGeometryManager.getSharedBuffer(0);
    this.drawing = this.sharedBuffer.getDrawing();
    let sceneEl = document.querySelector("a-scene");
    this.scene = sceneEl.object3D;
    this.scene.add(this.drawing);

    if (this.data.debug) {
      this.debugGeometry = new THREE.SphereGeometry(0.005, 16, 16);
      this.debugMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    }
  },

  play() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
  },

  pause() {
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
  },

  tick(t, dt) {
    const currentPosition = this.el.object3D.position;

    if (currentPosition.distanceToSquared(this.lastPosition) > EPS) {
      this.direction.subVectors(currentPosition, this.lastPoint).normalize();
    }
    this.lastPosition.copy(currentPosition);

    if (this.isDrawing) {
      const time = this.timeSinceLastDraw + dt;
      if (
        time >= this.data.drawFrequency &&
        this.lastPoint.distanceTo(currentPosition) >= this.data.minDistanceBetweenPoints
      ) {
        this.addPoint(currentPosition);
      }

      this.timeSinceLastDraw = time % this.data.drawFrequency;
    }
  },

  onMouseDown(e) {
    if (e.button === 0) {
      this.isDrawing = true;
      this.startDraw();
    }
  },

  onMouseUp(e) {
    if (e.button === 0) {
      this.isDrawing = false;
      this.endDraw();
    }
  },

  startDraw: (() => {
    const normal = new THREE.Vector3();
    return function() {
      this.addPoint(this.el.object3D.position);
      this.getNormal(normal, this.el.object3D.position);
      this.drawStart(normal);
    };
  })(),

  endDraw: (() => {
    const endPoint = new THREE.Vector3();
    const direction = new THREE.Vector3();
    return function() {
      //add the final point  and cap
      this.addPoint(this.el.object3D.position);
      direction.copy(this.direction).multiplyScalar(this.data.radius);
      endPoint.copy(this.el.object3D.position).add(direction);
      this.drawCap(endPoint, this.currentSegments);

      //reset
      this.sharedBuffer.restartPrimitive();
      this.lastPointSet = false;
      this.lastSegmentsSet = false;
      this.timeSinceLastDraw = 0;
      // this.direction.copy(this.data.defaultDirection);
    };
  })(),

  //add a "cap" to the start or end of a drawing
  drawCap(point, segments) {
    let j = 0;
    for (let i = 0; i < this.data.segments * 2 - 1; i++) {
      if ((i - 1) % 3 === 0) {
        this.addVertex(point);
      } else {
        this.addVertex(segments[j % this.data.segments]);
        j++;
      }
    }
    this.sharedBuffer.update();
  },

  //calculate the segments for a given point
  addSegments(segmentsList, point, forward, up) {
    const angleIncrement = Math.PI * 2 / this.data.segments;
    for (let i = 0; i < this.data.segments; i++) {
      const segment = segmentsList[i];

      this.rotatePointAroundAxis(segment, point, forward, up, angleIncrement * i, this.data.radius);
    }
  },

  addVertex(point) {
    this.initialized = true;
    this.sharedBuffer.addVertex(point.x, point.y, point.z);

    if (this.data.debug) {
      const sphere = new THREE.Mesh(this.debugGeometry, this.debugMaterial);
      this.scene.add(sphere);
      sphere.position.copy(point);
    }
  },

  //get lastSegments, draw the start cap
  drawStart: (() => {
    const startPoint = new THREE.Vector3();
    const inverseDirection = new THREE.Vector3();
    return function(normal) {
      this.addSegments(this.lastSegments, this.lastPoint, this.direction, normal);

      inverseDirection
        .copy(this.direction)
        .negate()
        .multiplyScalar(this.data.radius);
      startPoint.copy(this.lastPoint).add(inverseDirection);

      //add the first vertex of the lastSegments if this drawing has already been initialized
      if (this.initialized) {
        this.addVertex(this.lastSegments[0]);
      }

      this.drawCap(startPoint, this.lastSegments);

      this.sharedBuffer.restartPrimitive();
      this.addVertex(this.lastSegments[0]);
    };
  })(),

  //helper function to get normal of direction of drawing cross direction to camera
  getNormal: (() => {
    const directionToCamera = new THREE.Vector3();
    return function(normal, position) {
      if (this.data.camera) {
        directionToCamera.subVectors(position, this.data.camera.object3D.position).normalize();
        normal.crossVectors(this.direction, directionToCamera);
      } else {
        normal.copy(this.el.object3D.up);
      }
    };
  })(),

  addPoint: (() => {
    const normal = new THREE.Vector3();
    return function(position) {
      if (this.lastPointSet) {
        this.getNormal(normal, position);

        this.addSegments(this.currentSegments, position, this.direction, normal);

        //draw the triangle strip
        for (let j = 0; j <= this.data.segments; j++) {
          this.addVertex(this.lastSegments[j % this.data.segments]);
          this.addVertex(this.currentSegments[j % this.data.segments]);
        }

        //update the drawing
        this.sharedBuffer.update();

        //copy the currentSegments to lastSegments
        for (var j = 0; j < this.data.segments; j++) {
          this.lastSegments[j].copy(this.currentSegments[j]);
        }
      }

      this.lastPoint.copy(position);
      this.lastPointSet = true;
    };
  })(),

  rotatePointAroundAxis: (() => {
    const calculatedDirection = new THREE.Vector3();
    return function(out, point, axis, up, angle, radius) {
      calculatedDirection.copy(up);
      calculatedDirection.applyAxisAngle(axis, angle);
      out.copy(point).add(calculatedDirection.normalize().multiplyScalar(radius));
    };
  })()
});
