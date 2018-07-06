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
    radius: { default: 0.2 },
    color: { default: { r: 255, g: 0, b: 0 } }
  },

  init() {
    //TODO: figure out how to make this look nice
    const options = {
      roughness: 0.25,
      metalness: 0.75,
      vertexColors: THREE.VertexColors,
      side: THREE.FrontSide,
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
            if (this.lineStarted) {
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

  //todo: if it is determined that a single point is trying to be drawn, just draw a point (sphere?)
  //todo: draw sphere as multiple increasingly small segment rings

  draw: (() => {
    return function(position, direction, normal) {
      if (!this.lineStarted) {
        this.addSegments(this.lastSegments, position, direction, normal);
        if (this.initialized) {
          this.addVertex(this.lastSegments[0]);
        }
        this.drawCap(this.lastPoint, this.lastSegments);
        this.lineStarted = true;
      } else {
        this.addSegments(this.currentSegments, position, direction, normal);

        //draw the triangle strip
        for (let i = 0; i != this.data.segments + 1; i++) {
          const lastSegment = this.lastSegments[i % this.data.segments];
          const currentSegment = this.currentSegments[i % this.data.segments];
          this.addVertex(lastSegment);
          this.addVertex(currentSegment);
        }
        this.sharedBuffer.restartPrimitive();
        this.addVertex(this.currentSegments[0]);

        //update the drawing
        this.sharedBuffer.update();

        //copy the currentSegments to lastSegments
        for (var j = 0; j < this.data.segments; j++) {
          this.lastSegments[j].copy(this.currentSegments[j]);
        }
      }

      this.lastPoint.copy(position);

      this.addToDrawBuffer(position, direction, normal);
    };
  })(),

  startDraw: (() => {
    return function(position, direction, normal) {
      this.lastPoint.copy(position);
      this.addToDrawBuffer(position, direction, normal);
    };
  })(),

  endDraw: (() => {
    const projectedDirection = new THREE.Vector3();
    const endPoint = new THREE.Vector3();
    return function(position, direction, normal) {
      //add the final point and cap
      this.draw(position, direction, normal);
      projectedDirection.copy(direction).multiplyScalar(this.data.radius);
      endPoint.copy(position).add(projectedDirection);
      this.drawCap(endPoint, this.currentSegments);

      //reset
      this.sharedBuffer.restartPrimitive();
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

  //add a "cap" to the start or end of a drawing
  //TODO: fix this algorithm
  drawCap(point, segments) {
    let j = 0;
    for (let i = 0; i < this.data.segments * 2 - 2; i++) {
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

  addVertex(point, normal) {
    this.initialized = true;
    this.sharedBuffer.addVertex(point.x, point.y, point.z);
    this.sharedBuffer.addColor(this.data.color.r, this.data.color.g, this.data.color.b);
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
