/* global THREE */
/**
 * Networked Drawing
 * @component networked-drawing
 */

import SharedBufferGeometryManager from "../../vendor/sharedbuffergeometrymanager";

AFRAME.registerComponent("networked-drawing", {
  schema: {
    drawPoints: { default: [] },
    segments: { default: 8 },
    radius: { default: 0.02 }
  },

  init() {
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xff0000 });

    this.sharedBufferGeometryManager = new SharedBufferGeometryManager();
    this.sharedBufferGeometryManager.addSharedBuffer(0, material, THREE.TriangleStripDrawMode);

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

    this.lastPoint = new THREE.Vector3();
    this.lastPointSet = false;
    this.initialized = false;
  },

  getLastPoint() {
    return this.lastPoint;
  },

  startDraw: (() => {
    const normal = new THREE.Vector3();
    return function(position, direction) {
      this.addPoint(position, direction);
      this.getNormal(position);
      this.drawStart(normal, direction);
    };
  })(),

  endDraw: (() => {
    const endPoint = new THREE.Vector3();
    const direction = new THREE.Vector3();
    return function(position, direction) {
      //add the final point  and cap
      this.addPoint(position, direction);
      direction.copy(direction).multiplyScalar(this.data.radius);
      endPoint.copy(position).add(direction);
      this.drawCap(endPoint, this.currentSegments);

      //reset
      this.sharedBuffer.restartPrimitive();
      this.lastPointSet = false;
      this.lastSegmentsSet = false;
      this.timeSinceLastDraw = 0;
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
  },

  //get lastSegments, draw the start cap
  drawStart: (() => {
    const startPoint = new THREE.Vector3();
    const inverseDirection = new THREE.Vector3();
    return function(normal, direction) {
      this.addSegments(this.lastSegments, this.lastPoint, direction, normal);

      inverseDirection
        .copy(direction)
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
    return function(normal, position, direction) {
      if (this.data.camera) {
        directionToCamera.subVectors(position, this.data.camera.object3D.position).normalize();
        normal.crossVectors(direction, directionToCamera);
      } else {
        normal.copy(this.el.object3D.up);
      }
    };
  })(),

  addPoint: (() => {
    const normal = new THREE.Vector3();
    return function(position, direction) {
      if (this.lastPointSet) {
        this.getNormal(normal, position);

        this.addSegments(this.currentSegments, position, direction, normal);

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
