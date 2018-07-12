/* global THREE */
/**
 * Networked Drawing
 * @component networked-drawing
 */

import SharedBufferGeometryManager from "../../vendor/sharedbuffergeometrymanager";

function round(x) {
  return Math.round(x * 100000) / 100000;
}

function copyData(fromArray, toArray, fromIndex, toIndex) {
  let i = fromIndex - 1;
  let j = -1;
  while (i + 1 <= toIndex) {
    toArray[++j] = fromArray[++i];
  }
}

AFRAME.registerComponent("networked-drawing", {
  schema: {
    segments: { default: 8 },
    radius: { default: 0.02 },
    color: { type: "color", default: "#00FF00" }
  },

  init() {
    this.drawBuffer = [];

    //TODO: figure out how to make this look nice
    const options = {
      roughness: 0.25,
      metalness: 0.75,
      vertexColors: THREE.VertexColors,
      side: THREE.DoubleSide,
      emissive: 0xffffff,
      emissiveIntensity: 0.1
      // wireframe: true
    };

    this.color = new THREE.Color();

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
    this.remoteLineStarted = false;

    this.lastPoint = new THREE.Vector3();
    this.initialized = false;

    this.bufferIndex = 0;

    this.sendDrawBuffer = this.sendDrawBuffer.bind(this);
    this.receiveDrawBuffer = this.receiveDrawBuffer.bind(this);

    document.body.addEventListener("clientConnected", this.sendDrawBuffer);

    NAF.connection.onConnect(() => {
      NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
        this.networkedEl = networkedEl;

        this.drawingId = "drawing-" + NAF.utils.getNetworkId(this.networkedEl);

        if (!NAF.utils.isMine(this.networkedEl)) {
          NAF.connection.subscribeToDataChannel(this.drawingId, this.receiveDrawBuffer);
        }
      });
    });

    this.debugGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    this.debugMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  },

  remove() {
    document.body.removeEventListener("clientConnected", this.sendDrawBuffer);
    NAF.connection.unsubscribeToDataChannel(this.drawingId, this.receiveDrawBuffer);

    this.scene.remove(this.drawing);
  },

  update(oldData) {
    if (oldData.color !== this.data.color) this.color.set(this.data.color);
  },

  tick: (() => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const copyArray = [];
    return function() {
      if (this.bufferIndex < this.drawBuffer.length && NAF.connection.isConnected() && this.networkedEl) {
        if (!NAF.utils.isMine(this.networkedEl)) {
          if (this.drawBuffer[this.bufferIndex] != null && this.bufferIndex + 9 <= this.drawBuffer.length) {
            --this.bufferIndex;
            position.set(
              this.drawBuffer[++this.bufferIndex],
              this.drawBuffer[++this.bufferIndex],
              this.drawBuffer[++this.bufferIndex]
            );
            direction.set(
              this.drawBuffer[++this.bufferIndex],
              this.drawBuffer[++this.bufferIndex],
              this.drawBuffer[++this.bufferIndex]
            );
            normal.set(
              this.drawBuffer[++this.bufferIndex],
              this.drawBuffer[++this.bufferIndex],
              this.drawBuffer[++this.bufferIndex]
            );
            if (!this.remoteLineStarted) {
              this.startDraw(position, direction, normal);
              this.remoteLineStarted = true;
            } else {
              this.draw(position, direction, normal);
            }
          } else if (this.drawBuffer[this.bufferIndex] === null) {
            this.endDraw(position, direction, normal);
            this.remoteLineStarted = false;
          }
          ++this.bufferIndex;
        } else if (this.drawBuffer.length > 0) {
          //TODO: don't do this on every tick?
          copyArray.length = 0;
          copyData(this.drawBuffer, copyArray, this.bufferIndex, this.drawBuffer.length - 1);
          NAF.connection.broadcastDataGuaranteed(this.drawingId, copyArray);
          this.bufferIndex = this.drawBuffer.length;
        }
      }
    };
  })(),

  sendDrawBuffer: (() => {
    const copyArray = [];
    //This number needs to be approx. < ~6000 based on napkin math
    //see: https://github.com/webrtc/adapter/blob/682e0f2439e139da6c0c406370eae820637b8c1a/src/js/common_shim.js#L157
    const chunkAmount = 3000;
    return function(evt) {
      if (NAF.utils.isMine(this.networkedEl)) {
        if (this.drawBuffer.length <= chunkAmount) {
          NAF.connection.sendDataGuaranteed(evt.detail.clientId, this.drawingId, this.drawBuffer);
        } else {
          //TODO: do this in tick?
          let x = 0;
          while (x < this.drawBuffer.length) {
            x = Math.min(x + chunkAmount, this.drawBuffer.length);
            copyArray.length = 0;
            copyData(this.drawBuffer, copyArray, x - chunkAmount, x - 1);
            NAF.connection.sendDataGuaranteed(evt.detail.clientId, this.drawingId, copyArray);
          }
        }
      }
    };
  })(),

  receiveDrawBuffer(_, dataType, data) {
    this.drawBuffer.push.apply(this.drawBuffer, data);
  },

  getLastPoint() {
    return this.lastPoint;
  },

  draw(position, direction, normal) {
    if (!NAF.connection.isConnected()) {
      return;
    }

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
    if (!NAF.connection.isConnected()) {
      return;
    }

    this.lastPoint.copy(position);
    this.addToDrawBuffer(position, direction, normal);
  },

  endDraw: (() => {
    const projectedDirection = new THREE.Vector3();
    const projectedPoint = new THREE.Vector3();
    return function(position, direction, normal) {
      if (!NAF.connection.isConnected()) {
        return;
      }

      if (!this.lineStarted) {
        this.drawPoint(position);
      } else {
        this.draw(position, direction, normal);
        projectedDirection.copy(direction).multiplyScalar(this.data.radius);
        projectedPoint.copy(position).add(projectedDirection);
        this.drawCap(projectedPoint, this.lastSegments);
      }

      if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
        this.drawBuffer.push(null);
      }
      this.lineStarted = false;
    };
  })(),

  addToDrawBuffer(position, direction, normal) {
    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
      this.drawBuffer.push(round(position.x));
      this.drawBuffer.push(round(position.y));
      this.drawBuffer.push(round(position.z));
      this.drawBuffer.push(round(direction.x));
      this.drawBuffer.push(round(direction.y));
      this.drawBuffer.push(round(direction.z));
      this.drawBuffer.push(round(normal.x));
      this.drawBuffer.push(round(normal.y));
      this.drawBuffer.push(round(normal.z));
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
        ++segmentIndex;
      }
    }
    this.sharedBuffer.restartPrimitive();
    this.sharedBuffer.update();
  },

  addVertex(point) {
    this.initialized = true;
    this.sharedBuffer.addVertex(point.x, point.y, point.z);
    this.sharedBuffer.addColor(this.color.r, this.color.g, this.color.b);
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
