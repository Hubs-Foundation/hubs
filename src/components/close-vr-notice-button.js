AFRAME.registerComponent("close-vr-notice-button", {
  init() {
    this.onClick = () => {
      this.el.sceneEl.emit("action_vr_notice_closed");
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
