AFRAME.registerComponent("player-info", {
  schema: {
    displayName: { type: "string" },
    avatarSrc: { type: "string" }
  },
  init() {
    this.applyProperties = this.applyProperties.bind(this);
  },
  play() {
    this.el.addEventListener("model-loaded", this.applyProperties);
  },
  pause() {
    this.el.removeEventListener("model-loaded", this.applyProperties);
  },
  update() {
    this.applyProperties();
  },
  applyProperties() {
    const nametagEl = this.el.querySelector(".nametag");
    if (this.data.displayName && nametagEl) {
      nametagEl.setAttribute("text", {
        value: this.data.displayName
      });
    }

    const modelEl = this.el.querySelector(".model");
    if (this.data.avatarSrc && modelEl) {
      modelEl.setAttribute("gltf-model-plus", "src", this.data.avatarSrc);
    }
  }
});
