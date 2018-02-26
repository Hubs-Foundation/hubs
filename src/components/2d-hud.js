import styles from "./2d-hud.css";

AFRAME.registerComponent("2d-hud", {
  schema: {
    mic: { default: "#mic-flat" }
  },

  init() {
    this.mic = document.querySelector(this.data.mic);

    this.nametag = document.createElement("div");
    this.nametag.classList.add(styles.nametagShown);

    this.avatar = document.createElement("div");
    this.avatar.classList.add(styles.avatarImageShown);

    this.bg = document.createElement("div");
    this.bg.classList.add(styles.bgShown);
    this.horizontalRegion = document.createElement("div");
    this.horizontalRegion.classList.add(styles.horizontalRegion);

    const scene = document.querySelector("a-scene");

    document.body.appendChild(this.horizontalRegion);
    this.horizontalRegion.appendChild(this.bg);
    this.bg.appendChild(this.mic);
    this.bg.appendChild(this.nametag);
    this.bg.appendChild(this.avatar);

    this.onUsernameChanged = this.onUsernameChanged.bind(this);
    scene.addEventListener("username-changed", this.onUsernameChanged);

    this.addBlue = () => this.nametag.classList.add(styles.blueText);
    this.removeBlue = () => this.nametag.classList.remove(styles.blueText);
    this.addFlipX = () => this.avatar.classList.add(styles.flipX);
    this.removeFlipX = () => this.avatar.classList.remove(styles.flipX);
  },

  play() {
    this.nametag.addEventListener("mouseover", this.addBlue);
    this.nametag.addEventListener("mouseout", this.removeBlue);

    this.avatar.addEventListener("mouseover", this.addFlipX);
    this.avatar.addEventListener("mouseout", this.removeFlipX);
  },

  pause() {
    this.nametag.removeEventListener("mouseover", this.addBlue);
    this.nametag.removeEventListener("mouseout", this.removeBlue);

    this.avatar.removeEventListener("mouseover", this.addFlipX);
    this.avatar.removeEventListener("mouseout", this.removeFlipX);
  },

  onUsernameChanged(evt) {
    console.log("changed!");
    console.log("got username: ", evt.detail.username);
    this.nametag.innerHTML = evt.detail.username;
  }
});
