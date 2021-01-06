AFRAME.registerComponent("remove-button", {
  init() {
    this.onClick = () => {
      this.remove(this.owner);
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

  async remove(clientId) {
    this.el.sceneEl.emit("action_remove_client", { clientId });
  }
});
