AFRAME.registerComponent("inspect-button", {
  tick() {
    if (!this.initializedInTick) {
      // initialize in tick so that parent's `tags` component has been initialized
      this.initializedInTick = true;
      this.el.object3D.addEventListener("holdable-button-down", () => {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.inspect(this.el, 1.5);
      });
      this.el.object3D.addEventListener("holdable-button-up", () => {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.uninspect();
      });
    }
  }
});
