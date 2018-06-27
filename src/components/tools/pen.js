/**
 * Pen tool
 * @component pen
 */

import SharedBufferGeometryManager from "../../vendor/sharedbuffergeometrymanager";

AFRAME.registerComponent("pen", {
  schema: {
    drawFrequency: { default: 1000 },
    drawPoints: { default: [] },
    minDistanceBetweenPoints: { default: 0.05 },
    segments: { default: 3 },
    radius: { default: 0.05 },
    debug: { default: true }
  },

  init() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    let material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xff0000 });

    this.sharedBufferGeometryManager = new SharedBufferGeometryManager();
    this.sharedBufferGeometryManager.addSharedBuffer(0, material, THREE.TriangleStripDrawMode);

    this.isDrawing = false;
    this.timeSinceLastDraw = 0;

    this.lastPosition = new THREE.Vector3();
    this.lastPositionSet = false;
    this.lastSegmentsSet = false;
    this.firstVertex = true;
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
      this.debugGeometry = new THREE.SphereGeometry(0.005, 32, 32);
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

  tick: (() => {
    return function(t, dt) {
      if (this.isDrawing && this.timeSinceLastDraw + dt >= this.data.drawFrequency) {
        this.addPoint(this.el.object3D.position);
        this.sharedBuffer.update();
      }

      this.timeSinceLastDraw = (this.timeSinceLastDraw + dt) % this.data.drawFrequency;
    };
  })(),

  onMouseDown(e) {
    if (e.button === 0) {
      this.isDrawing = true;
      this.restart();
    }
  },

  onMouseUp(e) {
    if (e.button === 0) {
      this.isDrawing = false;
    }
  },

  restart() {
    this.sharedBuffer.restartPrimitive();

    //restart the draw (readd the last vertex) if this drawing has already been started
    if (!this.firstVertex) {
      this.restartDraw = true;
    }
    this.lastPositionSet = false;
    this.lastSegmentsSet = false;
  },

  addSegments(segmentsList, point, forward, up) {
    const angleIncrement = Math.PI * 2 / this.data.segments;
    for (let i = 0; i < this.data.segments; i++) {
      const segment = segmentsList[i];

      this.rotatePointAroundAxis(segment, point, forward, up, angleIncrement * i, this.data.radius);

      if (this.data.debug) {
        const sphere = new THREE.Mesh(this.debugGeometry, this.debugMaterial);
        this.scene.add(sphere);
        sphere.position.copy(segment);
      }
    }
  },

  addVertex(point) {
    this.firstVertex = false;
    this.sharedBuffer.addVertex(point.x, point.y, point.z);
  },

  addPoint: (() => {
    const forward = new THREE.Vector3();
    return function(position) {
      if (this.lastPositionSet) {
        //don't draw if distance from last point is not far enough
        const distance = position.distanceTo(this.lastPosition);
        if (distance >= this.data.minDistanceBetweenPoints) {
          //calculate forward only if I have lastPositionSet
          forward.subVectors(position, this.lastPosition).normalize();

          //if I don't have the lastSegments yet, add them now
          if (!this.lastSegmentsSet) {
            this.addSegments(this.lastSegments, this.lastPosition, forward, THREE.Object3D.DefaultUp);
            this.lastSegmentsSet = true;
          }

          //add currentSegments
          this.addSegments(this.currentSegments, position, forward, THREE.Object3D.DefaultUp);

          //add the first vertex of the currentSegment if this is a restartDraw
          if (this.restartDraw) {
            this.addVertex(this.lastSegments[0]);
            this.restartDraw = false;
          }

          //draw the triangle strip
          // this.printSegments();
          for (var j = 0; j <= this.data.segments; j++) {
            this.addVertex(this.lastSegments[j % this.data.segments]);
            this.addVertex(this.currentSegments[j % this.data.segments]);
          }

          //copy the currentSegments to lastSegments
          for (var j = 0; j < this.data.segments; j++) {
            this.lastSegments[j].copy(this.currentSegments[j]);
          }

          this.lastPosition.copy(position);
        }
      } else {
        this.lastPosition.copy(position);
        this.lastPositionSet = true;
      }
    };
  })(),

  rotatePointAroundAxis: (() => {
    const calculatedDirection = new THREE.Vector3();
    return function(out, point, axis, up, angle, radius) {
      calculatedDirection.copy(up);
      calculatedDirection.applyAxisAngle(axis, angle);
      out.copy(point).add(calculatedDirection.normalize().multiplyScalar(radius));
    };
  })(),

  printSegments() {
    console.group("lastSegments");
    for (var i = 0; i < this.data.segments; i++) {
      console.log(this.lastSegments[i].x, this.lastSegments[i].y, this.lastSegments[i].z);
    }
    console.groupEnd();

    console.group("currentSegments");
    for (var j = 0; j < this.data.segments; j++) {
      console.log(this.currentSegments[j].x, this.currentSegments[j].y, this.currentSegments[j].z);
    }
    console.groupEnd();
  }
});
