export class LobbyCameraSystem {
  tick() {
    const el = document.querySelector("[scene-preview-camera]");
    if (el) {
      if (!AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspected) {
        el.components["scene-preview-camera"].tick2();
      }
    }
  }
}
