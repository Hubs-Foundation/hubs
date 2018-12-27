AFRAME.registerComponent("camera-focus-button", {
  schema: {
    track: { default: false }
  },

  init() {
    this.cameraSystem = this.el.sceneEl.systems["camera-tools"];

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      const myCamera = this.cameraSystem.getMyCamera();
      if (!myCamera) return;

      myCamera.components["camera-tool"].focus(this.targetEl, this.data.track);
    };
  },

  tick() {
    const isVisible = this.el.getAttribute("visible");
    const shouldBeVisible = !!(this.cameraSystem && this.cameraSystem.getMyCamera());

    if (isVisible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
