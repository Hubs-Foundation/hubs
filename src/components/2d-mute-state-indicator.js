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
    this.muteIcon.id = "mic-flat";
    this.muteIcon.classList.add(styles.indicator);
    console.log("foobar");
    console.log(this.muteIcon);
    document.body.appendChild(this.muteIcon);

    this.updateMuteState();

    this.onMouseOver = () => this.muteIcon.classList.toggle(styles.muted, !this.el.sceneEl.is("muted"));

    this.onMouseOut = () => this.muteIcon.classList.toggle(styles.muted, this.el.sceneEl.is("muted"));

    this.onClick = () => this.el.emit("action_mute");
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateToggled);

    this.muteIcon.addEventListener("mouseover", this.onMouseOver);
    this.muteIcon.addEventListener("mouseout", this.onMouseOut);
    this.muteIcon.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateToggled);

    this.muteIcon.removeEventListener("mouseover", this.onMouseOver);
    this.muteIcon.removeEventListener("mouseout", this.onMouseOut);
    this.muteIcon.removeEventListener("click", this.onClick);
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
