/* global THREE */
/**
 * Creates procedurally generated 'lines' (or tubes) that are networked.
 * @namespace drawing
 * @component networked-drawing
 */

import SharedBufferGeometryManager from "../../utils/sharedbuffergeometrymanager";

const MSG_CONFIRM_CONNECT = 0;
const MSG_BUFFER_DATA = 1;
const MSG_BUFFER_DATA_FULL = 2;

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
    segments: { default: 8 }, //the number of "sides" the procedural tube should have
    defaultRadius: { default: 0.01 }, //the radius of the procedural tube
    minDrawTimeout: { default: 5000 }, //the minimum time a drawn line will live
    maxDrawTimeout: { default: 600000 }, //the maximum time a drawn line will live
    maxLines: { default: 25 }, //how many lines can persist before lines older than minDrawTime are removed
    maxPointsPerLine: { default: 250 } //the max number of points a single line can have
  },

  init() {
    this.drawBuffer = [];
    this.tempDrawBuffer = [];
    this.receivedBufferParts = 0;
    this.drawBufferInitialized = false;
    this.bufferIndex = 0;
    this.drawBufferHistory = [];

    const options = {
      vertexColors: THREE.VertexColors
    };

    this.color = new THREE.Color();
    this.radius = this.data.defaultRadius;
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

    this.drawStarted = false;
    this.lineStarted = false;
    this.remoteLineStarted = false;

    this.lastPoint = new THREE.Vector3();
    this.lastDrawTime = -1;

    this.connectedToOwner = false;

    this.prevIdx = Object.assign({}, this.sharedBuffer.idx);
    this.idx = Object.assign({}, this.sharedBuffer.idx);
    this.vertexCount = 0;
    this.drawBufferCount = 0;
    this.currentPointCount = 0;

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
          this.connectedToOwner = true;
        }
      }

      if (this.drawBuffer.length > 0 && NAF.connection.isConnected() && this.networkedEl) {
        if (!NAF.utils.isMine(this.networkedEl)) {
          const head = this.drawBuffer[0];
          if (head !== null && typeof head === "string") {
            this.color.set(head);
            this.drawBuffer.shift();
          } else if (head != null && this.drawBuffer.length >= 9) {
            position.set(this.drawBuffer[0], this.drawBuffer[1], this.drawBuffer[2]);
            direction.set(this.drawBuffer[3], this.drawBuffer[4], this.drawBuffer[5]);
            this.radius = direction.length(); //radius is encoded as length of direction vector
            direction.normalize();
            normal.set(this.drawBuffer[6], this.drawBuffer[7], this.drawBuffer[8]);
            //TODO: maybe encode segments in normal vector?

            if (!this.remoteLineStarted) {
              this.startDraw(position, direction, normal);
              this.remoteLineStarted = true;
            } else {
              this.doDraw(position, direction, normal);
            }
            this.drawBuffer.splice(0, 9);
          } else if (head === null && this.remoteLineStarted) {
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
    const length = this.drawBufferHistory.length;
    if (length > 0) {
      const now = Date.now();
      const time = this.drawBufferHistory[0].time;
      if (
        (length > this.data.maxLines && time + this.data.minDrawTimeout <= now) ||
        time + this.data.maxDrawTimeout <= now
      ) {
        const datum = this.drawBufferHistory[0];
        if (length > 1) {
          datum.idxLength += 2 - (this.segments % 2);
          this.drawBufferHistory[1].idxLength -= 2 - (this.segments % 2);
        }
        this.idx.position = datum.idxLength;
        this.idx.uv = datum.idxLength;
        this.idx.normal = datum.idxLength;
        this.idx.color = datum.idxLength;
        this.sharedBuffer.remove(this.prevIdx, this.idx);
        this.drawBufferHistory.shift();
        if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
          this.drawBuffer.splice(0, datum.drawBufferCount);
          this.bufferIndex -= datum.drawBufferCount;
        }
      }
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
            type: MSG_BUFFER_DATA_FULL,
            parts: 1,
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
              type: MSG_BUFFER_DATA_FULL,
              parts: Math.ceil(this.drawBuffer.length / chunkAmount),
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
        if (this.drawBufferInitialized) {
          this.drawBuffer.push.apply(this.drawBuffer, data.buffer);
        } else {
          this.tempDrawBuffer.push.apply(this.tempDrawBuffer, data.buffer);
        }
        break;
      case MSG_BUFFER_DATA_FULL:
        this.drawBuffer.push.apply(this.drawBuffer, data.buffer);
        if (++this.receivedBufferParts >= data.parts) {
          this.drawBufferInitialized = true;
          if (this.tempDrawBuffer.length > 0) {
            this.drawBuffer.push.apply(this.drawBuffer, this.tempDrawBuffer);
            this.tempDrawBuffer = [];
          }
        }
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

    this.drawStarted = true;

    if (color) {
      this.color.set(color);
      this.pushToDrawBuffer(color);
    }
    if (radius) this.radius = radius;
    if (segments) this.segments = segments;

    this.lastPoint.copy(position);
    this.addToDrawBuffer(position, direction, normal);
    this.lastDrawTime = Date.now();
  },

  draw(position, direction, normal) {
    if (!NAF.connection.isConnected() || !this.drawStarted) {
      return;
    }

    this.doDraw(position, direction, normal);

    this.addToDrawBuffer(position, direction, normal);
  },

  doDraw: (() => {
    const capNormal = new THREE.Vector3();
    return function(position, direction, normal, radiusMultiplier = 1.0) {
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
        if (this.currentPointCount > this.data.maxPointsPerLine) {
          this.doEndDraw(position, direction);
          this.endLine();
        } else {
          this.addSegments(this.currentSegments, position, direction, normal, this.radius * radiusMultiplier);
          this.drawCylinder();
        }
      }
      this.lastPoint.copy(position);
    };
  })(),

  endDraw(position, direction, normal) {
    if (!this.lineStarted && this.drawStarted) {
      this.drawPoint(position);
    } else {
      this.draw(position, direction, normal);
      this.doEndDraw(position, direction);
    }
    this.endLine();
  },

  doEndDraw: (() => {
    const projectedDirection = new THREE.Vector3();
    const projectedPoint = new THREE.Vector3();
    return function(position, direction) {
      if (this.lineStarted && this.drawStarted) {
        projectedDirection.copy(direction).multiplyScalar(this.radius);
        projectedPoint.copy(position).add(projectedDirection);

        this.addDegenerateTriangle(); //flip faceculling order before drawing end-cap
        this.drawCap(projectedPoint, this.lastSegments, direction);
      }
    };
  })(),

  endLine() {
    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) this.pushToDrawBuffer(null);
    this.drawBufferHistory.push({
      drawBufferCount: this.drawBufferCount,
      idxLength: this.vertexCount - 1,
      time: Date.now()
    });
    this.vertexCount = 0;
    this.drawBufferCount = 0;
    this.currentPointCount = 0;
    this.lineStarted = false;
    this.drawStarted = false;
  },

  addToDrawBuffer(position, direction, normal) {
    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
      ++this.currentPointCount;
      this.pushToDrawBuffer(round(position.x));
      this.pushToDrawBuffer(round(position.y));
      this.pushToDrawBuffer(round(position.z));
      direction.setLength(this.radius); //encode radius as length of direction vector
      this.pushToDrawBuffer(round(direction.x));
      this.pushToDrawBuffer(round(direction.y));
      this.pushToDrawBuffer(round(direction.z));
      this.pushToDrawBuffer(round(normal.x));
      this.pushToDrawBuffer(round(normal.y));
      this.pushToDrawBuffer(round(normal.z));
    }
  },

  pushToDrawBuffer(val) {
    ++this.drawBufferCount;
    this.drawBuffer.push(val);
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
      this.doDraw(projectedPoint, down, left, 0.75);

      this.doDraw(position, down, left);

      projectedDirection.copy(down).multiplyScalar(this.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this.doDraw(projectedPoint, down, left, 0.75);

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
