/* global THREE */
/**
 * Networked Drawing
 * @component networked-drawing
 */

import SharedBufferGeometryManager from "../../vendor/sharedbuffergeometrymanager";

AFRAME.registerComponent("networked-drawing", {
  schema: {
    drawBuffer: { default: [] },
    segments: { default: 8 },
    radius: { default: 0.02 },
    color: { default: { r: 255, g: 0, b: 0 } }
  },

  init() {
    //TODO: figure out how to make this look nice
    const options = {
      roughness: 0.25,
      metalness: 0.75,
      vertexColors: THREE.VertexColors,
      side: THREE.DoubleSide,
      emissive: 0xff0000
    };

    const material = new THREE.MeshStandardMaterial(options);

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
    const sceneEl = document.querySelector("a-scene");
    this.scene = sceneEl.object3D;
    this.scene.add(this.drawing);

    this.lineStarted = false;

    this.lastPoint = new THREE.Vector3();
    this.initialized = false;

    this.bufferIndex = 0;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
    });

    this.debugGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    this.debugMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  },

  tick: (() => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    return function() {
      if (this.networkedEl) {
        const isMine = NAF.utils.isMine(this.networkedEl);
        if (!isMine) {
          if (this.peekBuffer() != null) {
            position.set(this.getNextFromBuffer(), this.getNextFromBuffer(), this.getNextFromBuffer());
            direction.set(this.getNextFromBuffer(), this.getNextFromBuffer(), this.getNextFromBuffer());
            normal.set(this.getNextFromBuffer(), this.getNextFromBuffer(), this.getNextFromBuffer());

            if (!this.lineStarted) {
              this.startDraw(position, direction, normal);
            } else {
              this.draw(position, direction, normal);
            }
          } else if (this.data.drawBuffer.length > this.bufferIndex) {
            this.endDraw(position, direction, normal);
            this.bufferIndex++;
          }
        } else if (this.data.drawBuffer.length > 0) {
          this.bufferIndex = this.data.drawBuffer.length - 1;
        }
      }
    };
  })(),

  peekBuffer() {
    return this.data.drawBuffer[this.bufferIndex];
  },

  getNextFromBuffer() {
    return this.data.drawBuffer[this.bufferIndex++];
  },

  getLastPoint() {
    return this.lastPoint;
  },

  draw(position, direction, normal) {
    if (!this.lineStarted) {
      this.addSegments(this.lastSegments, position, direction, normal, this.data.radius);
      if (this.initialized) {
        this.addVertex(this.lastSegments[0]); //discarded
      }
      this.drawCap(this.lastPoint, this.lastSegments);
      this.lineStarted = true;
    } else {
      this.addSegments(this.currentSegments, position, direction, normal, this.data.radius);
      this.drawCylinder();
    }
    this.lastPoint.copy(position);
    this.addToDrawBuffer(position, direction, normal);
  },

  startDraw(position, direction, normal) {
    this.lastPoint.copy(position);
    this.addToDrawBuffer(position, direction, normal);
  },

  endDraw: (() => {
    const projectedDirection = new THREE.Vector3();
    const projectedPoint = new THREE.Vector3();
    return function(position, direction, normal) {
      if (!this.lineStarted) {
        this.drawPoint(position);
      } else {
        this.draw(position, direction, normal);
        projectedDirection.copy(direction).multiplyScalar(this.data.radius);
        projectedPoint.copy(position).add(projectedDirection);
        this.drawCap(projectedPoint, this.lastSegments);
      }

      if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
        this.data.drawBuffer.push(null);
      }
      this.lineStarted = false;
    };
  })(),

  addToDrawBuffer(position, direction, normal) {
    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
      this.data.drawBuffer.push(position.x);
      this.data.drawBuffer.push(position.y);
      this.data.drawBuffer.push(position.z);
      this.data.drawBuffer.push(direction.x);
      this.data.drawBuffer.push(direction.y);
      this.data.drawBuffer.push(direction.z);
      this.data.drawBuffer.push(normal.x);
      this.data.drawBuffer.push(normal.y);
      this.data.drawBuffer.push(normal.z);
    }
  },

  //draw a cylinder from last to current segments
  drawCylinder() {
    this.addVertex(this.lastSegments[0]); //discarded
    for (let i = 0; i != this.data.segments + 1; i++) {
      this.addVertex(this.lastSegments[i % this.data.segments]);
      this.addVertex(this.currentSegments[i % this.data.segments]);
    }

    this.sharedBuffer.restartPrimitive();

    this.sharedBuffer.update();

    for (var j = 0; j < this.data.segments; j++) {
      this.lastSegments[j].copy(this.currentSegments[j]);
    }
  },

  //draw a standalone point in space
  drawPoint: (() => {
    const up = new THREE.Vector3(0, 1, 0);
    const down = new THREE.Vector3(0, -1, 0);
    const left = new THREE.Vector3(1, 0, 0);
    const projectedDirection = new THREE.Vector3();
    const projectedPoint = new THREE.Vector3();
    return function(position) {
      projectedDirection.copy(up).multiplyScalar(this.data.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.addSegments(this.lastSegments, projectedPoint, up, left, this.data.radius * 0.5);
      if (this.initialized) {
        this.addVertex(this.lastSegments[0]); //discarded
      }
      projectedDirection.copy(up).multiplyScalar(this.data.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);
      this.drawCap(projectedPoint, this.lastSegments);
      this.addVertex(this.lastSegments[0]); //discared
      this.addSegments(this.currentSegments, position, up, left, this.data.radius * 0.75);
      this.drawCylinder();
      projectedDirection.copy(down).multiplyScalar(this.data.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.addSegments(this.currentSegments, projectedPoint, up, left, this.data.radius * 0.5);
      this.drawCylinder();
      projectedDirection.copy(down).multiplyScalar(this.data.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);
      this.drawCap(projectedPoint, this.lastSegments);
    };
  })(),

  //draw a cap to start/end a line
  drawCap(point, segments) {
    let segmentIndex = 0;
    for (let i = 0; i < this.data.segments + 4; i++) {
      if ((i - 1) % 4 === 0) {
        this.addVertex(point);
      } else {
        this.addVertex(segments[segmentIndex % this.data.segments]);
        segmentIndex++;
      }
    }
    this.sharedBuffer.restartPrimitive();
    this.sharedBuffer.update();
  },

  addVertex(point) {
    this.initialized = true;
    this.sharedBuffer.addVertex(point.x, point.y, point.z);
    this.sharedBuffer.addColor(this.data.color.r, this.data.color.g, this.data.color.b);
    // const sphere = new THREE.Mesh(this.debugGeometry, this.debugMaterial);
    // this.scene.add(sphere);
    // sphere.position.copy(point);
  },

  //calculate the segments for a given point
  addSegments(segmentsList, point, forward, up, radius) {
    const angleIncrement = Math.PI * 2 / this.data.segments;
    for (let i = 0; i < this.data.segments; i++) {
      const segment = segmentsList[i];
      this.rotatePointAroundAxis(segment, point, forward, up, angleIncrement * i, radius);
    }
  },

  rotatePointAroundAxis: (() => {
    const calculatedDirection = new THREE.Vector3();
    return function(out, point, axis, up, angle, radius) {
      calculatedDirection.copy(up);
      calculatedDirection.applyAxisAngle(axis, angle);
      out.copy(point).add(calculatedDirection.normalize().multiplyScalar(radius));
    };
  })()
});
