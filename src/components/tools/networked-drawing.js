/* global THREE */
/**
 * Networked Drawing
 * Creates procedurally generated 'lines' (or tubes) that are networked.
 * @namespace drawing
 * @component networked-drawing
 */

import SharedBufferGeometryManager from "../../utils/sharedbuffergeometrymanager";
import MobileStandardMaterial from "../../materials/MobileStandardMaterial";

const MSG_CONFIRM_CONNECT = 0;
const MSG_BUFFER_DATA = 1;
const MSG_BUFFER_DATA_FULL = 2;

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
    maxDrawTimeout: { default: 600000 }, //the maximum time a drawn line will live
    maxLines: { default: 50 }, //how many lines can persist before lines older than minDrawTime are removed
    maxPointsPerLine: { default: 250 } //the max number of points a single line can have
  },

  init() {
    this._receiveData = this._receiveData.bind(this);

    this.networkBuffer = [];

    this.sendNetworkBufferQueue = [];

    this.drawStarted = false;
    this.lineStarted = false;
    this.remoteLineStarted = false;

    this.receivedBufferParts = 0;
    this.bufferIndex = 0;
    this.connectedToOwner = false;
    this.networkBufferInitialized = false;

    const options = {
      vertexColors: THREE.VertexColors
    };

    this.color = new THREE.Color();
    this.radius = this.data.defaultRadius;
    this.segments = this.data.segments;

    let material = new THREE.MeshStandardMaterial(options);
    if (window.APP && window.APP.quality === "low") {
      material = MobileStandardMaterial.fromStandardMaterial(material);
    }

    this.sharedBufferGeometryManager = new SharedBufferGeometryManager();
    // NOTE: 20 is approximate for how many floats per point are added.
    // maxLines + 1 because a line can be currently drawing while at maxLines.
    // Multiply by 1/3 (0.333) because 3 floats per vertex (x, y, z).
    const maxBufferSize = Math.round(this.data.maxPointsPerLine * 20 * (this.data.maxLines + 1) * 0.333);
    this.sharedBufferGeometryManager.addSharedBuffer(0, material, THREE.TriangleStripDrawMode, maxBufferSize);

    this.lastPoint = new THREE.Vector3();

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

    this.el.setObject3D("mesh", this.drawing);

    const environmentMapComponent = this.el.sceneEl.components["environment-map"];
    if (environmentMapComponent) {
      environmentMapComponent.applyEnvironmentMap(this.drawing);
    }

    this.prevIdx = Object.assign({}, this.sharedBuffer.idx);
    this.idx = Object.assign({}, this.sharedBuffer.idx);
    this.vertexCount = 0; //number of vertices added for current line (used for line deletion).
    this.networkBufferCount = 0; //number of items added to networkBuffer for current line (used for line deletion).
    this.currentPointCount = 0; //number of points added for current line (used for maxPointsPerLine).
    this.invalidPointRead = false; //flag flipped if we read a bad point anywhere during this line
    this.lastReadPointCount = 0; //last read point count read off of the network, used for sanity checking
    this.networkBufferHistory = []; //tracks vertexCount and networkBufferCount so that lines can be deleted.

    NAF.connection.onConnect(() => {
      NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
        this.networkedEl = networkedEl;
        this.networkId = NAF.utils.getNetworkId(this.networkedEl);
        this.drawingId = "drawing-" + this.networkId;
        NAF.connection.subscribeToDataChannel(this.drawingId, this._receiveData);
      });
    });
  },

  play() {
    AFRAME.scenes[0].systems["hubs-systems"].drawingMenuSystem.registerDrawingMenu(this.el);
  },

  remove() {
    NAF.connection.unsubscribeToDataChannel(this.drawingId, this._receiveData);

    this.drawStarted = false;

    this.el.removeObject3D("mesh");

    const drawingManager = this.el.sceneEl.querySelector("#drawing-manager").components["drawing-manager"];
    drawingManager.destroyDrawing();

    AFRAME.scenes[0].systems["hubs-systems"].drawingMenuSystem.unregisterDrawingMenu(this.el);
  },

  tick(t) {
    const connected = NAF.connection.isConnected() && this.networkedEl;
    const isMine = connected && NAF.utils.isMine(this.networkedEl);

    if (!this.connectedToOwner && connected) {
      const owner = NAF.utils.getNetworkOwner(this.networkedEl);
      if (!isMine && NAF.connection.hasActiveDataChannel(owner)) {
        NAF.connection.sendDataGuaranteed(owner, this.drawingId, {
          type: MSG_CONFIRM_CONNECT,
          clientId: NAF.clientId
        });
        this.connectedToOwner = true;
      }
    }

    if (this.networkBuffer.length > 0 && connected) {
      if (!isMine) {
        this._drawFromNetwork();
      } else if (this.bufferIndex < this.networkBuffer.length) {
        this._broadcastDrawing();
      }
    }

    //TODO: handle possibility that a clientId gets stuck in sendNetworkBufferQueue
    //if that client disconnects before this executes and an activeDataChannel is opened.
    if (isMine && this.sendNetworkBufferQueue.length > 0) {
      const connected = [];
      for (let i = 0; i < this.sendNetworkBufferQueue.length; i++) {
        if (NAF.connection.hasActiveDataChannel(this.sendNetworkBufferQueue[i])) {
          connected.push(this.sendNetworkBufferQueue[i]);
        }
      }
      for (let j = 0; j < connected.length; j++) {
        const pos = this.sendNetworkBufferQueue.indexOf(connected[j]);
        this._sendNetworkBuffer(connected[j]);
        this.sendNetworkBufferQueue.splice(pos, 1);
      }
    }

    this._deleteExpiredLines(t);
  },

  _broadcastDrawing: (() => {
    const copyArray = [];
    return function() {
      copyArray.length = 0;
      copyData(this.networkBuffer, copyArray, this.bufferIndex, this.networkBuffer.length - 1);

      //remove undo's from networkBuffer after they've been sent so that
      //newly joining clients don't get them
      let index = -1;
      while ((index = this.networkBuffer.indexOf("-")) != -1) {
        this.networkBuffer.splice(index, 1);
      }
      this.bufferIndex = this.networkBuffer.length;
      NAF.connection.broadcastDataGuaranteed(this.drawingId, { type: MSG_BUFFER_DATA, buffer: copyArray });
    };
  })(),

  _drawFromNetwork: (() => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    return function() {
      let head = this.networkBuffer[0];
      if (head === "-") {
        this._undoDraw();
        this.networkBuffer.shift();
        head = this.networkBuffer[0];
      }
      let didWork = false;
      while (head != null && this.networkBuffer.length >= 11) {
        const pointCount = this.networkBuffer[0];

        // This is a sanity check against the sequence number to help uncover remaining bugs.
        // If the point is out-of-order, report the error and stop drawing this line.
        if (pointCount !== this.lastReadPointCount + 1) {
          this.invalidPointRead = true;

          console.error(
            `Draw networking error: ID ${this.drawingId} expected point ${this.lastReadPointCount +
              1} but received ${pointCount}`
          );
        }

        this.lastReadPointCount = pointCount;
        position.set(this.networkBuffer[1], this.networkBuffer[2], this.networkBuffer[3]);
        direction.set(this.networkBuffer[4], this.networkBuffer[5], this.networkBuffer[6]);
        this.radius = Math.round(direction.length() * 1000) / 1000; //radius is encoded as length of direction vector
        direction.normalize();
        normal.set(this.networkBuffer[7], this.networkBuffer[8], this.networkBuffer[9]);
        this.color.setHex(Math.round(normal.length()) - 1); //color is encoded as length of normal vector
        normal.normalize();

        this.networkBuffer.splice(0, 10);

        if (!this.remoteLineStarted) {
          this.startDraw(position, direction, normal);
          this.remoteLineStarted = true;
        }

        if (this.networkBuffer[0] === null) {
          if (!this.invalidPointRead) {
            this._endDraw(position, direction, normal);
          }

          this.remoteLineStarted = false;
          this.networkBuffer.shift();
          this.lastReadPointCount = 0;
          this.invalidPointRead = false;
        } else {
          if (!this.invalidPointRead) {
            this._draw(position, direction, normal);
            didWork = true;
          }
        }
      }
      if (didWork) this._updateBuffer();
    };
  })(),

  _deleteExpiredLines(time) {
    const length = this.networkBufferHistory.length;
    if (length > 0) {
      const drawTime = this.networkBufferHistory[0].time;
      if (length > this.data.maxLines || drawTime + this.data.maxDrawTimeout <= time) {
        const datum = this.networkBufferHistory[0];
        if (length > 1) {
          datum.idxLength += 2 - (this.segments % 2); //account for extra verts added for degenerate triangles
          this.networkBufferHistory[1].idxLength -= 2 - (this.segments % 2);
        }
        this.idx.position = datum.idxLength;
        this.idx.uv = datum.idxLength;
        this.idx.normal = datum.idxLength;
        this.idx.color = datum.idxLength;
        this.sharedBuffer.remove(this.prevIdx, this.idx);
        this.networkBufferHistory.shift();
        if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
          this.networkBuffer.splice(0, datum.networkBufferCount);
          this.bufferIndex -= datum.networkBufferCount;
        }
      }
    }
  },

  _sendNetworkBuffer: (() => {
    const copyArray = [];
    //This number needs to be approx. < ~6000 based on napkin math
    //see: https://github.com/webrtc/adapter/blob/682e0f2439e139da6c0c406370eae820637b8sc1a/src/js/common_shim.js#L157
    const chunkAmount = 3000;
    return function(clientId) {
      if (NAF.utils.isMine(this.networkedEl)) {
        if (this.networkBuffer.length <= chunkAmount) {
          NAF.connection.sendDataGuaranteed(clientId, this.drawingId, {
            type: MSG_BUFFER_DATA_FULL,
            parts: 1,
            buffer: this.networkBuffer
          });
        } else {
          let start = 0;
          let end = 0;
          while (end < this.networkBuffer.length) {
            end = Math.min(end + chunkAmount, this.networkBuffer.length);
            copyArray.length = 0;
            copyData(this.networkBuffer, copyArray, start, end - 1);
            start = end;
            NAF.connection.sendDataGuaranteed(clientId, this.drawingId, {
              type: MSG_BUFFER_DATA_FULL,
              parts: Math.ceil(this.networkBuffer.length / chunkAmount),
              buffer: copyArray
            });
          }
        }
      }
    };
  })(),

  _receiveData(_, dataType, data) {
    switch (data.type) {
      case MSG_CONFIRM_CONNECT:
        this.sendNetworkBufferQueue.push(data.clientId);
        break;
      case MSG_BUFFER_DATA:
        if (this.networkBufferInitialized) {
          this.networkBuffer.push.apply(this.networkBuffer, data.buffer);
        }
        break;
      case MSG_BUFFER_DATA_FULL:
        this.networkBuffer.push.apply(this.networkBuffer, data.buffer);
        if (++this.receivedBufferParts >= data.parts) {
          this.networkBufferInitialized = true;
        }
        break;
    }
  },

  getLastPoint() {
    return this.lastPoint;
  },

  startDraw(position, direction, normal, color, radius) {
    if (!NAF.connection.isConnected()) {
      return;
    }

    this.drawStarted = true;

    if (color) {
      this.color.set(color);
    }
    if (radius) this.radius = radius;

    this.lastPoint.copy(position);
    this._addToNetworkBuffer(position, direction, normal);
  },

  draw(position, direction, normal, color, radius) {
    if (!NAF.connection.isConnected() || !this.drawStarted) {
      return;
    }

    if (color && color != "#" + this.color.getHexString().toUpperCase()) {
      this.color.set(color);
    }
    if (radius) this.radius = radius;

    this._addToNetworkBuffer(position, direction, normal);
    this._draw(position, direction, normal);

    this._updateBuffer();
  },

  _draw: (() => {
    const capNormal = new THREE.Vector3();
    return function(position, direction, normal, radiusMultiplier = 1.0) {
      if (!this.lineStarted) {
        this._generateSegments(this.lastSegments, position, direction, normal, this.radius * radiusMultiplier);

        if (this.networkBufferHistory.length === 0) {
          //start with CW faceculling order
          this._addDegenerateTriangle();
        } else {
          //only do the following if the sharedBuffer is not empty
          this._restartPrimitive();
          this._addDegenerateTriangle();
          if (this.segments % 2 === 0) {
            //flip faceculling order if even numbered segments
            this._addDegenerateTriangle();
          }
        }

        //get normal for tip of cap
        capNormal.copy(direction).negate();
        //get normals for rim of cap
        for (let i = 0; i < this.segments; i++) {
          this.lastSegments[i].normal.add(capNormal).multiplyScalar(0.5);
        }

        this._drawCap(this.lastPoint, this.lastSegments, capNormal);
        if (this.segments % 2 !== 0) {
          //flip faceculling order if odd numbered segments
          this._addDegenerateTriangle();
        }

        this.lineStarted = true;
      } else {
        this._generateSegments(this.currentSegments, position, direction, normal, this.radius * radiusMultiplier);
        this._drawCylinder();

        if (this.currentPointCount > this.data.maxPointsPerLine) {
          this._drawEndCap(position, direction);
          this._endLine();
        }
      }
      this.lastPoint.copy(position);
    };
  })(),

  undoDraw() {
    if (!NAF.connection.isConnected() || this.drawStarted) {
      return;
    }
    this._undoDraw();
    this._pushToNetworkBuffer("-");
  },

  _undoDraw() {
    const length = this.networkBufferHistory.length;
    if (length > 0) {
      const datum = this.networkBufferHistory.pop();
      this.idx.position = 0;
      this.idx.uv = 0;
      this.idx.normal = 0;
      this.idx.color = 0;
      if (length > 1) {
        datum.idxLength += 1 - (this.segments % 2); //account for extra verts added for degenerate triangles
        this.idx.position = this.sharedBuffer.idx.position - datum.idxLength;
        this.idx.uv = this.sharedBuffer.idx.uv - datum.idxLength;
        this.idx.normal = this.sharedBuffer.idx.normal - datum.idxLength;
        this.idx.color = this.sharedBuffer.idx.color - datum.idxLength;
      }
      this.sharedBuffer.remove(this.idx, this.sharedBuffer.idx);
      if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
        this.networkBuffer.splice(this.networkBuffer.length - datum.networkBufferCount, datum.networkBufferCount);
        this.bufferIndex -= datum.networkBufferCount;
      }
    }
  },

  endDraw(position, direction, normal) {
    this._endDraw(position, direction, normal);
    this._updateBuffer();
  },

  _endDraw(position, direction, normal) {
    if (!this.lineStarted && this.drawStarted) {
      this._drawPoint(position);
    } else if (this.lineStarted && this.drawStarted) {
      this._addToNetworkBuffer(position, direction, normal);
      this._draw(position, direction, normal);
      this._drawEndCap(position, direction);
    }
    this._endLine();
  },

  _drawEndCap: (() => {
    const projectedDirection = new THREE.Vector3();
    const projectedPoint = new THREE.Vector3();
    return function(position, direction) {
      if (this.lineStarted && this.drawStarted) {
        projectedDirection.copy(direction).multiplyScalar(this.radius);
        projectedPoint.copy(position).add(projectedDirection);
        this._addDegenerateTriangle(); //flip faceculling order before drawing end-cap
        this._drawCap(projectedPoint, this.lastSegments, direction);
      }
    };
  })(),

  _endLine() {
    if (!this.drawStarted) return;

    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) this._pushToNetworkBuffer(null);

    const datum = {
      networkBufferCount: this.networkBufferCount,
      idxLength: this.vertexCount - 1,
      time: this.el.sceneEl.clock.elapsedTime * 1000
    };
    this.networkBufferHistory.push(datum);
    this.vertexCount = 0;
    this.networkBufferCount = 0;
    this.currentPointCount = 0;
    this.lineStarted = false;
    this.drawStarted = false;

    this.sharedBuffer.computeBoundingSpheres();
  },

  _addToNetworkBuffer: (() => {
    const copyDirection = new THREE.Vector3();
    const copyNormal = new THREE.Vector3();
    return function(position, direction, normal) {
      if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
        ++this.currentPointCount;
        this._pushToNetworkBuffer(this.currentPointCount);
        this._pushToNetworkBuffer(position.x);
        this._pushToNetworkBuffer(position.y);
        this._pushToNetworkBuffer(position.z);
        copyDirection.copy(direction);
        copyDirection.setLength(this.radius); //encode radius as length of direction vector
        this._pushToNetworkBuffer(copyDirection.x);
        this._pushToNetworkBuffer(copyDirection.y);
        this._pushToNetworkBuffer(copyDirection.z);
        copyNormal.copy(normal);
        copyNormal.setLength(this.color.getHex() + 1); //encode color as length, add one in case color is black
        this._pushToNetworkBuffer(copyNormal.x);
        this._pushToNetworkBuffer(copyNormal.y);
        this._pushToNetworkBuffer(copyNormal.z);
      }
    };
  })(),

  _pushToNetworkBuffer(val) {
    //don't increment networkBufferCount if undo, because the undo character
    //will be removed in tick() on the next frame
    if (val !== "-") {
      ++this.networkBufferCount;
    }
    this.networkBuffer.push(val);
  },

  //draw a cylinder from last to current segments
  _drawCylinder() {
    //average the normals with the normals from the lastSegment
    //not a perfect normal calculation, but works well enough
    for (let i = 0; i < this.segments; i++) {
      this.currentSegments[i].normal.add(this.lastSegments[i].normal).multiplyScalar(0.5);
    }

    for (let i = 0; i != this.segments + 1; i++) {
      this._addVertex(this.lastSegments[i % this.segments]);
      this._addVertex(this.currentSegments[i % this.segments]);
    }

    for (let i = 0; i < this.segments; i++) {
      this.lastSegments[i].position.copy(this.currentSegments[i].position);
      this.lastSegments[i].normal.copy(this.currentSegments[i].normal);
    }
  },

  //draw a standalone point in space
  _drawPoint: (() => {
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
      this._draw(projectedPoint, down, left, 0.75);

      this._draw(position, down, left);

      projectedDirection.copy(down).multiplyScalar(this.radius * 0.5);
      projectedPoint.copy(position).add(projectedDirection);
      this._draw(projectedPoint, down, left, 0.75);

      projectedDirection.copy(down).multiplyScalar(this.radius * 0.75);
      projectedPoint.copy(position).add(projectedDirection);

      this._addDegenerateTriangle(); //discarded
      this._drawCap(projectedPoint, this.lastSegments, down);
    };
  })(),

  //draw a cap to start/end a line
  _drawCap(point, segments, normal) {
    let segmentIndex = 0;
    for (let i = 0; i < this.segments * 2 - (this.segments % 2); i++) {
      if ((i - 2) % 4 === 0) {
        this._addVertex({ position: point, normal: normal });
      } else {
        this._addVertex(segments[segmentIndex % this.segments]);
        if ((i + 1) % 5 !== 0) {
          ++segmentIndex;
        }
      }
    }
  },

  _restartPrimitive() {
    this.sharedBuffer.restartPrimitive();
    ++this.vertexCount;
  },

  _updateBuffer() {
    this.sharedBuffer.update();
  },

  _addVertex(segment) {
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

  _addDegenerateTriangle() {
    this._addVertex(this.lastSegments[0]);
  },

  //calculate the segments for a given point
  _generateSegments(segmentsList, point, forward, up, radius) {
    const angleIncrement = (Math.PI * 2) / this.segments;
    for (let i = 0; i < this.segments; i++) {
      const segment = segmentsList[i].position;
      this._rotatePointAroundAxis(segment, point, forward, up, angleIncrement * i, radius);
      segmentsList[i].normal.subVectors(segment, point).normalize();
    }
  },

  _rotatePointAroundAxis: (() => {
    const calculatedDirection = new THREE.Vector3();
    return function(out, point, axis, up, angle, radius) {
      calculatedDirection.copy(up);
      calculatedDirection.applyAxisAngle(axis, angle);
      out.copy(point).add(calculatedDirection.normalize().multiplyScalar(radius));
    };
  })()
});
