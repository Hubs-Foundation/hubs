const IDENTITY = new THREE.Matrix4().identity();
export class CursorPoseTrackingSystem {
  constructor() {
    this.pairs = [];
  }
  register(object3D, path) {
    object3D.applyMatrix4(IDENTITY); // make sure target gets updated at least once for our matrix optimizations
    this.pairs.push({ object3D, path });
  }
  unregister(object3D) {
    this.pairs = this.pairs.filter(p => p.object3D !== object3D);
  }
  tick() {
    for (let i = 0; i < this.pairs.length; i++) {
      const matrix = AFRAME.scenes[0].systems.userinput.get(this.pairs[i].path);
      if (matrix) {
        const o = this.pairs[i].object3D;
        o.matrix.copy(matrix);
        o.matrix.decompose(o.position, o.quaternion, o.scale);
        o.matrixWorldNeedsUpdate = true;
      }
    }
  }
}
