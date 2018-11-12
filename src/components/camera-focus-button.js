AFRAME.registerComponent("camera-focus-button", {
  schema: {
    track: { default: false }
  },

  init() {
    this.cameraSystem = this.el.sceneEl.systems.cameras;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onClick = () => {
      if (!this.cameraSystem) return;

      const currentCamera = this.cameraSystem.getCurrent();
      if (!currentCamera) return;

      currentCamera.components["camera-tool"].focus(this.targetEl, this.data.track);
    };
  },

  tick() {
    const isVisible = this.el.getAttribute("visible");
    const shouldBeVisible = !!(this.cameraSystem && this.cameraSystem.getCurrent());

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
