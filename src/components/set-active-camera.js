AFRAME.registerComponent("set-active-camera", {
  init() {
    // This is a hack needed to set the active camera because sometimes A-Frame will create the default camera and set it to the active camera on startup because the query selector to find an existing camera in the scene fails.

    const cameraSystem = this.el.sceneEl.systems.camera;
    const currentActiveCamera = cameraSystem.activeCameraEl;

    if (currentActiveCamera !== this.el) {
      cameraSystem.setActiveCamera(this.el);

      // Also A-Frame fails to delete the default camera :P
      currentActiveCamera.parentNode.removeChild(currentActiveCamera);

      // Look controls leaves behind this CSS class.
      this.el.sceneEl.canvas.classList.remove("a-grab-cursor");
    }
  }
});
