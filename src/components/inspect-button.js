import { getInspectable } from "../systems/camera-system";

AFRAME.registerComponent("inspect-button", {
  tick() {
    if (!this.initializedInTick) {
      // initialize in tick so that parent's `tags` component has been initialized
      this.initializedInTick = true;

      this.inspectable = getInspectable(this.el);
      if (!this.inspectable) {
        console.error("You put an inspect button but I could not find what you want to inspect.", this.el);
        return;
      }
      this.el.object3D.addEventListener("holdable-button-down", () => {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.inspect(this.inspectable.object3D);
      });
      this.el.object3D.addEventListener("holdable-button-up", () => {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.uninspect();
      });
    }
  }
});
