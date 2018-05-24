AFRAME.registerComponent("camera-controller", {
  schema: {
    lookDownLimit: { default: -50 },
    lookUpLimit: { default: 50 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
    this.rotation = { x: 0, y: 0, z: 0 };
  },

  look(deltaPitch, deltaYaw) {
    const { lookDownLimit, lookUpLimit } = this.data;
    this.pitch += deltaPitch;
    this.pitch = Math.max(lookDownLimit, Math.min(lookUpLimit, this.pitch));
    this.yaw += deltaYaw;
  },

  tick() {
    this.rotation.x = this.pitch;
    this.rotation.y = this.yaw;
    this.el.setAttribute("rotation", this.rotation);
  }
});
