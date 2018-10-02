const degToRad = THREE.Math.degToRad;
const radToDeg = THREE.Math.radToDeg;

AFRAME.registerComponent("pitch-yaw-rotator", {
  schema: {
    minPitch: { default: -50 },
    maxPitch: { default: 50 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
  },

  look(deltaPitch, deltaYaw) {
    const { minPitch, maxPitch } = this.data;
    this.pitch += deltaPitch;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
    this.yaw += deltaYaw;
  },

  set(pitch, yaw) {
    this.pitch = radToDeg(pitch);
    this.yaw = radToDeg(yaw);
  },

  tick() {
    this.el.object3D.rotation.set(degToRad(this.pitch), degToRad(this.yaw), 0);
    this.el.object3D.rotation.order = "YXZ";
  }
});
