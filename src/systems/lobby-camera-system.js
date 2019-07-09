export class LobbyCameraSystem {
  tick() {
    const el = document.querySelector("[scene-preview-camera]");
    if (el) {
      el.components["scene-preview-camera"].tick2();
    }
  }
}
