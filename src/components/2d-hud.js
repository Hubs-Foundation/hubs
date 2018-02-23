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

    this.onUsernameChanged = this.onUsernameChanged.bind(this);

    const scene = document.querySelector("a-scene");
    console.log(scene);
    scene.addEventListener("username-changed", this.onUsernameChanged);

    document.body.appendChild(this.horizontalRegion);
    this.horizontalRegion.appendChild(this.bg);
    this.bg.appendChild(this.mic);
    this.bg.appendChild(this.nametag);
    this.bg.appendChild(this.avatar);
  },

  onUsernameChanged(evt) {
    console.log("changed!");
    console.log("got username: ", evt.detail.username);
    this.nametag.innerHTML = evt.detail.username;
  }
});
