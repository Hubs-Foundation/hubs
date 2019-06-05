AFRAME.registerComponent("mute-button", {
  init() {
    this.onClick = () => {
      this.mute(this.owner);
    };
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.owner = networkedEl.components.networked.data.owner;
    });
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  },

  async mute(clientId) {
    this.el.sceneEl.emit("action_mute_client", { clientId });
  }
});
