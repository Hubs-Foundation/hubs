AFRAME.registerComponent("camera-scale", {
  init() {
    const camera = this.el.object3DMap.camera;
    camera.scale.set(1000, 1000, 1000);
  }
});
