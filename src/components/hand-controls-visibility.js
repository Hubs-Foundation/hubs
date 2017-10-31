AFRAME.registerComponent("hand-controls-visibility", {
  init() {
    this.onControllerConnected = this.onControllerConnected.bind(this);
    this.onControllerDisconnected = this.onControllerDisconnected.bind(this);
    this.el.addEventListener("controllerconnected", this.onControllerConnected);
    this.el.addEventListener(
      "controllerdisconnected",
      this.onControllerDisconnected
    );

    this.el.setAttribute("visible", false);
  },

  onControllerConnected() {
    this.el.setAttribute("visible", true);
  },

  onControllerDisconnected() {
    this.el.setAttribute("visible", false);
  }
});
