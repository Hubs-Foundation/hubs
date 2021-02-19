import SharedBufferGeometry from "./sharedbuffergeometry";

export default class SharedBufferGeometryManager {
  constructor() {
    this.sharedBuffers = {};
  }

  addSharedBuffer(name, material, maxBufferSize) {
    this.sharedBuffers[name] = new SharedBufferGeometry(material, maxBufferSize);
  }

  getSharedBuffer(name) {
    return this.sharedBuffers[name];
  }
}
