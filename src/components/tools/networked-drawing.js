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
    color: { type: "color", default: "#FF0000" }
  },

  init() {
    this.drawBuffer = [];

    const options = {
      //seems to require calling computeVertexNormals() if > 0
      roughness: 0,
      metalness: 0,
      vertexColors: THREE.VertexColors,
      side: THREE.DoubleSide
    };

    this.color = new THREE.Color(this.data.color);
    this.radius = this.data.radius;
    this.segments = this.data.segments;

    const material = new THREE.MeshBasicMaterial(options);
    console.log(material);
    this.sharedBufferGeometryManager = new SharedBufferGeometryManager();
    this.sharedBufferGeometryManager.addSharedBuffer(0, material, THREE.TriangleStripDrawMode);

    this.lastSegments = [];
    this.currentSegments = [];
    for (let x = 0; x < this.segments; x++) {
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
  },

  remove() {
    document.body.removeEventListener("clientConnected", this.sendDrawBuffer);
    NAF.connection.unsubscribeToDataChannel(this.drawingId, this.receiveDrawBuffer);

    this.scene.remove(this.drawing);
  },

  tick: (() => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const copyArray = [];
    return function() {
      if (this.bufferIndex < this.drawBuffer.length && NAF.connection.isConnected() && this.networkedEl) {
        if (!NAF.utils.isMine(this.networkedEl)) {
          const head = this.drawBuffer[this.bufferIndex];
          if (head != null && typeof head === "string") {
            //TODO: check radius and segments as well, somehow
            this.color.set(head);
          } else if (head != null && this.bufferIndex + 9 <= this.drawBuffer.length) {
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
          } else if (head === null) {
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
      this.addSegments(this.lastSegments, position, direction, normal, this.radius);
      if (this.initialized) {
        this.addVertex(this.lastSegments[0]); //discarded
      }
      this.drawCap(this.lastPoint, this.lastSegments);
      this.lineStarted = true;
    } else {
      this.addSegments(this.currentSegments, position, direction, normal, this.radius);
      this.drawCylinder();
    }
    this.lastPoint.copy(position);
    this.addToDrawBuffer(position, direction, normal);
  },

  startDraw(position, direction, normal, color, radius, segments) {
    if (!NAF.connection.isConnected()) {
      return;
    }

    if (color && color != "#" + this.color.getHex()) {
      this.color.set(color);
      this.drawBuffer.push(color);
    }
    if (radius) this.radius = radius;
    if (segments) this.segments = segments;

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
        projectedDirection.copy(direction).multiplyScalar(this.radius);
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
    for (let i = 0; i != this.segments + 1; i++) {
      this.addVertex(this.lastSegments[i % this.segments]);
      this.addVertex(this.currentSegments[i % this.segments]);
    }

    this.sharedBuffer.restartPrimitive();

    this.sharedBuffer.update();

    for (let j = 0; j < this.segments; j++) {
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
      projectedDirection.copy(up).multiplyScalar(this.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.addSegments(this.lastSegments, projectedPoint, up, left, this.radius * 0.5);
      if (this.initialized) {
        this.addVertex(this.lastSegments[0]); //discarded
      }
      projectedDirection.copy(up).multiplyScalar(this.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);
      this.drawCap(projectedPoint, this.lastSegments);
      this.addVertex(this.lastSegments[0]); //discared
      this.addSegments(this.currentSegments, position, up, left, this.radius * 0.75);
      this.drawCylinder();
      projectedDirection.copy(down).multiplyScalar(this.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.addSegments(this.currentSegments, projectedPoint, up, left, this.radius * 0.5);
      this.drawCylinder();
      projectedDirection.copy(down).multiplyScalar(this.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);
      this.drawCap(projectedPoint, this.lastSegments);
    };
  })(),

  //draw a cap to start/end a line
  drawCap(point, segments) {
    let segmentIndex = 0;
    for (let i = 0; i < this.segments + 4; i++) {
      if ((i - 1) % 4 === 0) {
        this.addVertex(point);
      } else {
        this.addVertex(segments[segmentIndex % this.segments]);
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
  },

  //calculate the segments for a given point
  addSegments(segmentsList, point, forward, up, radius) {
    const angleIncrement = (Math.PI * 2) / this.segments;
    for (let i = 0; i < this.segments; i++) {
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
