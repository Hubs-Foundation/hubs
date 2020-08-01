const FART_LENGTH_MS = 2000;

export class FartSystem {
  constructor() {
    this.originalScale = new THREE.Vector3(1, 1, 1);
  }
  toot() {
    this.needsToFart = true;
  }
  tick(time) {
    if (this.needsToFart) {
      this.needsToFart = false;
      this.fartStartTime = time;
      if (!this.isFarting) {
        this.avatarRig = document.getElementById("avatar-rig").object3D;
        this.originalScale.copy(this.avatarRig.scale);
      }
      this.isFarting = true;
    }

    if (!this.isFarting) {
      return;
    }
    const timeSinceToot = time - this.fartStartTime;
    if (timeSinceToot < FART_LENGTH_MS) {
      const modX = (1 + -Math.sin(timeSinceToot / 300)) * 0.15;
      const modZ = (1 + Math.sin(timeSinceToot / 300)) * 0.15;
      this.avatarRig.scale.set(modX + this.originalScale.x, this.originalScale.y, modZ + this.originalScale.z);
      this.avatarRig.matrixNeedsUpdate = true;
    } else {
      this.isFarting = false;
      this.avatarRig.scale.copy(this.originalScale);
      this.avatarRig.matrixNeedsUpdate = true;
    }
  }
}
