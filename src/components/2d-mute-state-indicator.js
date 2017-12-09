import styles from "./2d-mute-state-indicator.css";
/**
 * Shows a 2d incicator on screen reflecting mute state
 * @TODO this probably shouldnt be an aframe component but baring any other 2d UI handling it feels cleaner here than jsut free-flaoting
 */
AFRAME.registerComponent("2d-mute-state-indicator", {
  schema: {},

  init() {
    this.onStateToggled = this.onStateToggled.bind(this);

    this.muteIcon = document.createElement("div");
    this.muteIcon.classList.add(styles.indicator);
    document.body.appendChild(this.muteIcon);

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
    const muted = this.el.sceneEl.is("muted");
    this.muteIcon.classList.toggle(styles.muted, muted);
  }
});
