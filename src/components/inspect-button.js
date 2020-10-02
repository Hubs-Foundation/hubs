import { getInspectableAndPivot } from "../systems/camera-system";

AFRAME.registerComponent("inspect-button", {
  tick() {
    if (!this.initializedInTick) {
      // initialize in tick so that parent's `tags` component has been initialized
      this.initializedInTick = true;

      const { inspectable, pivot } = getInspectableAndPivot(this.el);
      if (!pivot) {
        console.error("You put an inspect button but I could not find what you want to inspect.", this.el);
        return;
      }
      this.el.object3D.addEventListener("holdable-button-down", () => {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.inspect(inspectable, pivot, 1, false);
      });
      this.el.object3D.addEventListener("holdable-button-up", () => {
        this.el.sceneEl.systems["hubs-systems"].cameraSystem.uninspect();
      });
    }
  }
});
