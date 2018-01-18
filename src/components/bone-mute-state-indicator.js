/**
 * Toggles the position of 2 bones into "on" and "off" positions to indicate mute state.
 */
AFRAME.registerComponent("bone-mute-state-indicator", {
  schema: {
    unmutedBoneName: { default: "Watch_Joint_MicON" },
    mutedBoneName: { default: "Watch_Joint_Muted" },
    onPos: { default: 0.81 },
    offPos: { default: 0.5 },
    analyserSrc: { type: "selector" }
  },

  init() {
    this.onStateToggled = this.onStateToggled.bind(this);
    this.el.addEventListener("model-loaded", () => {
      this.unmutedBone = this.el.object3D.getObjectByName(this.data.unmutedBoneName);
      this.mutedBone = this.el.object3D.getObjectByName(this.data.mutedBoneName);
      this.modelLoaded = true;

      this.updateMuteState();
    });
    this.onAudioFrequencyChange = this.onAudioFrequencyChange.bind(this);
  },

  onAudioFrequencyChange(e) {
    const muted = this.el.sceneEl.is("muted");
    if (muted) return;
    this.unmutedBone.position.y = this.data.onPos + e.detail.volume / 150;
    this.unmutedBone.scale.setScalar(1.0 + e.detail.volume / 300);
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateToggled);
    this.data.analyserSrc.addEventListener("audioFrequencyChange", this.onAudioFrequencyChange);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateToggled);
    this.data.analyserSrc.removeEventListener("audioFrequencyChange", this.onAudioFrequencyChange);
  },

  onStateToggled(e) {
    if (!e.detail.state === "muted") return;
    this.updateMuteState();
  },

  updateMuteState() {
    if (!this.modelLoaded) return;
    const muted = this.el.sceneEl.is("muted");
    this.mutedBone.position.y = muted ? this.data.onPos : this.data.offPos;
    this.unmutedBone.position.y = !muted ? this.data.onPos : this.data.offPos;
    this.unmutedBone.scale.setScalar(1.0);
    this.mutedBone.scale.setScalar(1.0);
  }
});
