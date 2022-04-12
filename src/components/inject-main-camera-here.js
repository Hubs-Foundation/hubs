AFRAME.registerComponent("inject-main-camera-here", {
  init() {
    // This is what actually puts the camera into the scene graph.
    // Ideally we would just be doing this ourselves, but we have to do it after the entity we want to parent it to is created
    // TODO any references to this entity should instead get the camera reference from the camera system
    this.el.setObject3D("camera", this.el.sceneEl.camera);
  }
});
