const degToRad = THREE.Math.degToRad;
AFRAME.registerComponent("pitch-yaw-rotator", {
  schema: {
    minPitch: { default: -50 },
    maxPitch: { default: 50 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
    this.rotation = { x: 0, y: 0, z: 0 };
  },

  look(deltaPitch, deltaYaw) {
    const { minPitch, maxPitch } = this.data;
    this.pitch += deltaPitch;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
    this.yaw += deltaYaw;
  },

  tick() {
    this.rotation.x = this.pitch;
    this.rotation.y = this.yaw;

    // Update rotation of object3D the same way the rotation component of aframe does,
    // skipping the work that would be done if we used this.el.setAttribute("rotation", this.rotation);
    this.el.object3D.rotation.set(degToRad(this.rotation.x), degToRad(this.rotation.y), degToRad(this.rotation.z));
    this.el.object3D.rotation.order = "YXZ";
  }
});
