import SharedBufferGeometry from "./sharedbuffergeometry";

export default class SharedBufferGeometryManager {
  constructor() {
    this.sharedBuffers = {};
  }

  addSharedBuffer(name, material, primitiveMode, maxBufferSize) {
    this.sharedBuffers[name] = new SharedBufferGeometry(material, primitiveMode, maxBufferSize);
  }

  getSharedBuffer(name) {
    return this.sharedBuffers[name];
  }
}
