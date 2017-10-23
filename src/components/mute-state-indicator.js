AFRAME.registerComponent("mute-state-indicator", {
  schema: {},

  init() {
    this.onStateToggled = this.onStateToggled.bind(this);
    this.updateMuteState();
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateToggled);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateToggled);
  },

  onStateToggled(e) {
    if (!e.detail.state === "muted") return;
    this.updateMuteState();
  },

  updateMuteState() {
    this.el.setAttribute(
      "material",
      "color",
      this.el.sceneEl.is("muted") ? "#ffd8ce" : "#d8eece"
    );
  }
});
