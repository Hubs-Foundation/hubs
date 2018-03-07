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
    document.body.appendChild(this.muteIcon);

    this.updateMuteState();

    this.onMouseOver = () => this.muteIcon.classList.toggle(styles.muted, !this.el.sceneEl.is("muted"));

    this.onMouseOut = () => this.muteIcon.classList.toggle(styles.muted, this.el.sceneEl.is("muted"));

    this.onClick = () => this.el.emit("action_mute");

    this.onMicAudio = e => {
      const red = 1.0 - e.detail.volume / 10.0;
      this.muteIcon.style["background-color"] = `rgb(${red * 255},255,255)`;
    };
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateToggled);

    this.muteIcon.addEventListener("mouseover", this.onMouseOver);
    this.muteIcon.addEventListener("mouseout", this.onMouseOut);
    this.muteIcon.addEventListener("click", this.onClick);

    this.el.sceneEl.addEventListener("micAudio", this.onMicAudio);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateToggled);

    this.muteIcon.removeEventListener("mouseover", this.onMouseOver);
    this.muteIcon.removeEventListener("mouseout", this.onMouseOut);
    this.muteIcon.removeEventListener("click", this.onClick);

    this.el.sceneEl.removeEventListener("micAudio", this.onMicAudio);
  },

  onStateToggled(e) {
    if (e.detail !== "muted") return;
    this.updateMuteState();
  },

  updateMuteState() {
    const muted = this.el.sceneEl.is("muted");
    this.muteIcon.classList.toggle(styles.muted, muted);
  }
});
