import SharedBufferGeometry from "./sharedbuffergeometry";

export default class SharedBufferGeometryManager {
  constructor() {
  	this.sharedBuffers = {};
  }

  addSharedBuffer(name, material, primitiveMode) {
    this.sharedBuffers[name]  = new SharedBufferGeometry(material, primitiveMode);
  }

  getSharedBuffer(name) {
    return this.sharedBuffers[name];
  }
}

