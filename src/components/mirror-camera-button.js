AFRAME.registerComponent("mirror-camera-button", {
  init() {
    this.onClick = () => {
      this.targetEl.components["camera-tool"].mirror();
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
