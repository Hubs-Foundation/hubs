import styles from "./2d-hud.css";
import avatarImg from "../assets/hud/avatar.jpg";

AFRAME.registerComponent("2d-hud", {
  schema: {
    mic: { default: "#mic-flat" }
  },

  init() {
    this.onUsernameChanged = this.onUsernameChanged.bind(this);
    this.onStateToggled = this.onStateToggled.bind(this);
    this.onMicClick = this.onMicClick.bind(this);
    this.onMicAudio = this.onMicAudio.bind(this);

    this.containerEl = document.createElement("div");
    this.containerEl.classList.add(styles.container);
    this.containerEl.innerHTML = `
      <div class="${styles.bg}">
        <div class="${styles.mic}"></div>
        <div class="${styles.nametag}"></div>
        <div class="${styles.avatar}"></div>
      </div>
    `;

    this.nametagEl = this.containerEl.querySelector(`.${styles.nametag}`);
    this.micEl = this.containerEl.querySelector(`.${styles.mic}`);

    document.body.appendChild(this.containerEl);
  },

  play() {
    this.el.sceneEl.addEventListener("username-changed", this.onUsernameChanged);
    this.el.sceneEl.addEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateToggled);
    this.el.sceneEl.addEventListener("micAudio", this.onMicAudio);
    this.micEl.addEventListener("click", this.onMicClick);
  },

  pause() {
    this.el.sceneEl.removeEventListener("username-changed", this.onUsernameChanged);
    this.el.sceneEl.removeEventListener("stateadded", this.onStateToggled);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateToggled);
    this.el.sceneEl.removeEventListener("micAudio", this.onMicAudio);
    this.micEl.removeEventListener("click", this.onMicClick);
  },

  remove() {
    this.conntainerEl.parentNode.removeChild(this.containerEl);
  },

  onUsernameChanged(evt) {
    this.nametagEl.innerHTML = evt.detail.username;
  },

  onMicClick() {
    this.el.emit("action_mute");
  },

  onMicAudio(e) {
    const red = 1.0 - e.detail.volume / 10.0;
    this.micEl.style["background-color"] = `rgb(${red * 255},240,240)`;
  },

  onStateToggled(e) {
    if (e.detail !== "muted") return;
    this.updateMuteState();
  },

  updateMuteState() {
    const muted = this.el.sceneEl.is("muted");
    this.micEl.classList.toggle(styles.muted, muted);
  }
});
