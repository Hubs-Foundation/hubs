import styles from "./2d-mic-state-indicator.css";
/**
 * Shows a 2d incicator on screen reflecting mute state
 * @TODO this probably shouldnt be an aframe component but baring any other 2d UI handling it feels cleaner here than jsut free-flaoting
 */
AFRAME.registerComponent("2d-mic-state-indicator", {
  schema: {
    analyserSrc: { type: "selector" }
  },

  init() {
    this.onStateToggled = this.onStateToggled.bind(this);

    this.muteIcon = document.createElement("div");
    this.muteIcon.classList.add(styles.indicator);
    document.body.appendChild(this.muteIcon);

    this.updateMuteState();
    this.onAudioFrequencyChange = this.onAudioFrequencyChange.bind(this);
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

  onAudioFrequencyChange(e) {
    if (this.el.sceneEl.is("muted")) return;
    const scale = 1 + e.detail.volume / 100;
    this.muteIcon.style.transform = `scale(${scale})`;
  },

  onStateToggled(e) {
    if (!e.detail.state === "muted") return;
    this.updateMuteState();
  },

  updateMuteState() {
    const muted = this.el.sceneEl.is("muted");
    this.muteIcon.classList.toggle(styles.muted, muted);
    this.muteIcon.classList.toggle(styles.unmuted, !muted);
    this.muteIcon.style.transform = "scale(1)";
  }
});
