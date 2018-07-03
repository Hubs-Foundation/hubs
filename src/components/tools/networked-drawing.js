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

    this.bufferIndex = 0;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
    });
  },

  tick: (() => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    return function() {
      if (this.networkedEl) {
        const isMine = NAF.utils.isMine(this.networkedEl);
        if (!isMine) {
          // console.log(this.data.drawBuffer);
          if (this.peekBuffer() != null) {
            position.set(this.getNextFromBuffer(), this.getNextFromBuffer(), this.getNextFromBuffer());
            direction.set(this.getNextFromBuffer(), this.getNextFromBuffer(), this.getNextFromBuffer());
            normal.set(this.getNextFromBuffer(), this.getNextFromBuffer(), this.getNextFromBuffer());

            if (!this.lastPointSet) {
              this.startDraw(position, direction, normal);
            } else {
              this.draw(position, direction, normal);
            }
          } else if (this.data.drawBuffer.length > this.bufferIndex) {
            if (this.lastPointSet) {
              this.endDraw(position, direction, normal);
            }
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

  draw: (() => {
    const normal = new THREE.Vector3();
    return function(position, direction, normal) {
      if (this.lastPointSet) {
        this.addSegments(this.currentSegments, position, direction, normal);

        //draw the triangle strip
        for (let i = 0; i <= this.data.segments; i++) {
          this.addVertex(this.lastSegments[i % this.data.segments]);
          this.addVertex(this.currentSegments[i % this.data.segments]);
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
    };
  })(),

  startDraw: (() => {
    const startPoint = new THREE.Vector3();
    const inverseDirection = new THREE.Vector3();
    return function(position, direction, normal) {
      //add the first point and cap
      this.draw(position, direction, normal);
      this.addSegments(this.lastSegments, this.getLastPoint(), direction, normal);

      inverseDirection
        .copy(direction)
        .negate()
        .multiplyScalar(this.data.radius);
      startPoint.copy(this.getLastPoint()).add(inverseDirection);

      //add the first vertex of the lastSegments if this drawing has already been initialized
      if (this.initialized) {
        this.addVertex(this.lastSegments[0]);
      }

      this.drawCap(startPoint, this.lastSegments);

      this.sharedBuffer.restartPrimitive();
      this.addVertex(this.lastSegments[0]);
    };
  })(),

  endDraw: (() => {
    const endPoint = new THREE.Vector3();
    const direction = new THREE.Vector3();
    return function(position, direction, normal) {
      //add the final point and cap
      this.draw(position, direction, normal);
      direction.copy(direction).multiplyScalar(this.data.radius);
      endPoint.copy(position).add(direction);
      this.drawCap(endPoint, this.currentSegments);

      //reset
      this.sharedBuffer.restartPrimitive();
      if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
        this.data.drawBuffer.push(null);
      }
      this.lastPointSet = false;
      this.lastSegmentsSet = false;
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

  rotatePointAroundAxis: (() => {
    const calculatedDirection = new THREE.Vector3();
    return function(out, point, axis, up, angle, radius) {
      calculatedDirection.copy(up);
      calculatedDirection.applyAxisAngle(axis, angle);
      out.copy(point).add(calculatedDirection.normalize().multiplyScalar(radius));
    };
  })()
});
