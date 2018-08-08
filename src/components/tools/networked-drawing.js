/* global THREE */
/**
 * Networked Drawing
 * @component networked-drawing
 */

import SharedBufferGeometryManager from "../../utils/sharedbuffergeometrymanager";

const MSG_CONFIRM_CONNECT = 0;
const MSG_BUFFER_DATA = 1;

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
    segments: { default: 4 },
    radius: { default: 0.02 },
    color: { type: "color", default: "#FF0000" },
    drawTimeout: { default: 5000 }
  },

  init() {
    this.drawBuffer = [];
    this.bufferIndex = 0;
    this.drawBufferHistory = [];

    const options = {
      vertexColors: THREE.VertexColors
    };

    this.color = new THREE.Color(this.data.color);
    this.radius = this.data.radius;
    this.segments = this.data.segments;

    const material = new THREE.MeshStandardMaterial(options);
    this.sharedBufferGeometryManager = new SharedBufferGeometryManager();
    this.sharedBufferGeometryManager.addSharedBuffer(0, material, THREE.TriangleStripDrawMode);

    this.lastSegments = [];
    this.currentSegments = [];
    for (let x = 0; x < this.segments; x++) {
      this.lastSegments[x] = {
        position: new THREE.Vector3(),
        normal: new THREE.Vector3()
      };
      this.currentSegments[x] = {
        position: new THREE.Vector3(),
        normal: new THREE.Vector3()
      };
    }

    this.sharedBuffer = this.sharedBufferGeometryManager.getSharedBuffer(0);
    this.drawing = this.sharedBuffer.drawing;
    const sceneEl = document.querySelector("a-scene");
    this.scene = sceneEl.object3D;
    this.scene.add(this.drawing);

    this.lineStarted = false;
    this.remoteLineStarted = false;

    this.lastPoint = new THREE.Vector3();
    this.lastDrawTime = -1;

    this.connectedToOwner = false;

    this.prevIdx = Object.assign({}, this.sharedBuffer.idx);
    this.idx = Object.assign({}, this.sharedBuffer.idx);
    this.vertexCount = 0;

    this.receiveData = this.receiveData.bind(this);

    NAF.connection.onConnect(() => {
      NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
        this.networkedEl = networkedEl;
        this.networkId = NAF.utils.getNetworkId(this.networkedEl);
        if (!this.networkId) {
          console.error("No networkId for", this.networkedEl);
        }
        this.drawingId = "drawing-" + this.networkId;

        NAF.connection.subscribeToDataChannel(this.drawingId, this.receiveData);
      });
    });
  },

  remove() {
    NAF.connection.unsubscribeToDataChannel(this.drawingId, this.receiveData);

    this.scene.remove(this.drawing);
  },

  tick: (() => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const copyArray = [];
    return function() {
      if (!this.connectedToOwner && NAF.connection.isConnected() && this.networkedEl) {
        const owner = NAF.utils.getNetworkOwner(this.networkedEl);
        if (!NAF.utils.isMine(this.networkedEl) && NAF.connection.hasActiveDataChannel(owner)) {
          NAF.connection.sendDataGuaranteed(owner, this.drawingId, {
            type: MSG_CONFIRM_CONNECT,
            clientId: NAF.clientId
          });
        }
        this.connectedToOwner = true;
      }

      if (this.drawBuffer.length > 0 && NAF.connection.isConnected() && this.networkedEl) {
        if (!NAF.utils.isMine(this.networkedEl)) {
          const head = this.drawBuffer[0];
          if (head !== null && typeof head === "string") {
            //TODO: check radius and segments as well, somehow
            this.color.set(head);
            this.drawBuffer.shift();
          } else if (head != null && this.drawBuffer.length >= 9) {
            position.set(this.drawBuffer[0], this.drawBuffer[1], this.drawBuffer[2]);
            direction.set(this.drawBuffer[3], this.drawBuffer[4], this.drawBuffer[5]);
            normal.set(this.drawBuffer[6], this.drawBuffer[7], this.drawBuffer[8]);
            if (!this.remoteLineStarted) {
              this.startDraw(position, direction, normal);
              this.remoteLineStarted = true;
            } else {
              this.draw(position, direction, normal);
            }
            this.drawBuffer.splice(0, 9);
          } else if (head === null) {
            this.endDraw(position, direction, normal);
            this.remoteLineStarted = false;
            this.drawBuffer.shift();
          }
        } else if (this.bufferIndex < this.drawBuffer.length) {
          //TODO: don't do this on every tick?
          copyArray.length = 0;
          copyData(this.drawBuffer, copyArray, this.bufferIndex, this.drawBuffer.length - 1);
          this.bufferIndex = this.drawBuffer.length;
          NAF.connection.broadcastDataGuaranteed(this.drawingId, { type: MSG_BUFFER_DATA, buffer: copyArray });
        }
      }

      this.deleteLines();
    };
  })(),

  deleteLines() {
    if (this.drawBufferHistory.length > 0 && this.drawBufferHistory[0].time + this.data.drawTimeout <= Date.now()) {
      const datum = this.drawBufferHistory[0];
      if (this.drawBufferHistory.length > 1) {
        datum.idxLength += 2 - (this.segments % 2);
        this.drawBufferHistory[1].idxLength -= 2 - (this.segments % 2);
      }
      this.idx.position = datum.idxLength;
      this.idx.uv = datum.idxLength;
      this.idx.normal = datum.idxLength;
      this.idx.color = datum.idxLength;
      this.sharedBuffer.remove(this.prevIdx, this.idx);
      this.drawBufferHistory.shift();
    }
  },

  sendDrawBuffer: (() => {
    const copyArray = [];
    //This number needs to be approx. < ~6000 based on napkin math
    //see: https://github.com/webrtc/adapter/blob/682e0f2439e139da6c0c406370eae820637b8c1a/src/js/common_shim.js#L157
    const chunkAmount = 3000;
    return function(clientId) {
      if (NAF.utils.isMine(this.networkedEl)) {
        if (this.drawBuffer.length <= chunkAmount) {
          NAF.connection.sendDataGuaranteed(clientId, this.drawingId, {
            type: MSG_BUFFER_DATA,
            buffer: this.drawBuffer
          });
        } else {
          //TODO: do this in tick?
          let x = 0;
          while (x < this.drawBuffer.length) {
            x = Math.min(x + chunkAmount, this.drawBuffer.length);
            copyArray.length = 0;
            copyData(this.drawBuffer, copyArray, x - chunkAmount, x - 1);
            NAF.connection.sendDataGuaranteed(clientId, this.drawingId, {
              type: MSG_BUFFER_DATA,
              buffer: copyArray
            });
          }
        }
      }
    };
  })(),

  receiveData(_, dataType, data) {
    switch (data.type) {
      case MSG_CONFIRM_CONNECT:
        this.sendDrawBuffer(data.clientId);
        break;
      case MSG_BUFFER_DATA:
        this.drawBuffer.push.apply(this.drawBuffer, data.buffer);
        break;
    }
  },

  getLastPoint() {
    return this.lastPoint;
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
    this.lastDrawTime = Date.now();
  },

  draw: (() => {
    const capNormal = new THREE.Vector3();
    return function(position, direction, normal, radiusMultiplier = 1.0) {
      if (!NAF.connection.isConnected()) {
        return;
      }

      if (!this.lineStarted) {
        this.addSegments(this.lastSegments, position, direction, normal, this.radius * radiusMultiplier);

        if (this.drawBufferHistory.length === 0) {
          //start with CW faceculling order
          this.addDegenerateTriangle();
        } else {
          //only do the following if the sharedBuffer is not empty
          this.restartPrimitive();
          this.addDegenerateTriangle();
          if (this.segments % 2 === 0) {
            //flip faceculling order if even numbered segments
            this.addDegenerateTriangle();
          }
        }

        //get normal for tip of cap
        capNormal.copy(direction).negate();
        //get normals for rim of cap
        for (let i = 0; i < this.segments; i++) {
          this.lastSegments[i].normal.add(capNormal).multiplyScalar(0.5);
        }

        this.drawCap(this.lastPoint, this.lastSegments, capNormal);
        if (this.segments % 2 !== 0) {
          //flip faceculling order if odd numbered segments
          this.addDegenerateTriangle();
        }

        this.lineStarted = true;
      } else {
        this.addSegments(this.currentSegments, position, direction, normal, this.radius * radiusMultiplier);
        this.drawCylinder();
      }
      this.lastPoint.copy(position);
      this.addToDrawBuffer(position, direction, normal);
    };
  })(),

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

        this.addDegenerateTriangle(); //flip faceculling order before drawing end-cap
        this.drawCap(projectedPoint, this.lastSegments, direction);
      }

      if (this.lineStarted && this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
        this.drawBuffer.push(null);
        this.drawBufferHistory.push({
          drawBufferIndex: this.drawBuffer.length,
          idxLength: this.vertexCount - 1,
          time: Date.now()
        });
      }
      this.vertexCount = 0;
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
    //average the normals with the normals from the lastSegment
    //not a perfect normal calculation, but works well enough
    for (let i = 0; i < this.segments; i++) {
      this.currentSegments[i].normal.add(this.lastSegments[i].normal).multiplyScalar(0.5);
    }

    for (let i = 0; i != this.segments + 1; i++) {
      this.addVertex(this.lastSegments[i % this.segments]);
      this.addVertex(this.currentSegments[i % this.segments]);
    }
    this.sharedBuffer.update();

    this.copySegments(this.currentSegments, this.lastSegments);
  },

  copySegments(source, target) {
    for (let i = 0; i < this.segments; i++) {
      target[i].position.copy(source[i].position);
      target[i].normal.copy(source[i].normal);
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
      projectedDirection.copy(up).multiplyScalar(this.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);
      this.lastPoint.copy(projectedPoint);

      projectedDirection.copy(up).multiplyScalar(this.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.draw(projectedPoint, down, left, 0.75);

      this.draw(position, down, left);

      projectedDirection.copy(down).multiplyScalar(this.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.draw(projectedPoint, down, left, 0.75);

      projectedDirection.copy(down).multiplyScalar(this.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);

      this.addDegenerateTriangle(); //discarded
      this.drawCap(projectedPoint, this.lastSegments, down);
    };
  })(),

  //draw a cap to start/end a line
  drawCap(point, segments, normal) {
    let segmentIndex = 0;
    for (let i = 0; i < this.segments * 2 - (this.segments % 2); i++) {
      if ((i - 2) % 4 === 0) {
        this.addVertex({ position: point, normal: normal });
      } else {
        this.addVertex(segments[segmentIndex % this.segments]);
        if ((i + 1) % 5 !== 0) {
          ++segmentIndex;
        }
      }
    }
    this.sharedBuffer.update();
  },

  restartPrimitive() {
    this.sharedBuffer.restartPrimitive();
    ++this.vertexCount;
  },

  addVertex(segment) {
    const point = segment.position;
    const normal = segment.normal;
    this.sharedBuffer.addVertex(point.x, point.y, point.z);
    this.sharedBuffer.addColor(this.color.r, this.color.g, this.color.b);

    if (normal) {
      this.sharedBuffer.addNormal(normal.x, normal.y, normal.z);
    } else {
      ++this.sharedBuffer.idx.normal;
    }

    ++this.sharedBuffer.idx.uv;
    ++this.vertexCount;
  },

  addDegenerateTriangle() {
    this.addVertex(this.lastSegments[0]);
  },

  //calculate the segments for a given point
  addSegments(segmentsList, point, forward, up, radius) {
    const angleIncrement = (Math.PI * 2) / this.segments;
    for (let i = 0; i < this.segments; i++) {
      const segment = segmentsList[i].position;
      this.rotatePointAroundAxis(segment, point, forward, up, angleIncrement * i, radius);
      segmentsList[i].normal.subVectors(segment, point).normalize();
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
