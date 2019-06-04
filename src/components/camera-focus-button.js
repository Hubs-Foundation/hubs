AFRAME.registerComponent("camera-focus-button", {
  schema: {
    track: { default: false },
    selector: { default: null }
  },

  init() {
    this.cameraSystem = this.el.sceneEl.systems["camera-tools"];

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      if (this.data.selector) {
        this.targetEl = networkedEl.querySelector(this.data.selector);
      } else {
        this.targetEl = networkedEl;
      }
    });

    this.onClick = () => {
      const myCamera = this.cameraSystem.getMyCamera();
      if (!myCamera) return;

      myCamera.components["camera-tool"].focus(this.targetEl, this.data.track);
    };
  },

  tick() {
    const isVisible = this.el.object3D.visible;
    const shouldBeVisible = !!(this.cameraSystem && this.cameraSystem.getMyCamera());

    if (isVisible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
