AFRAME.registerComponent("block-button", {
  init() {
    this.onClick = () => {
      this.block(this.owner);
    };
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.owner = networkedEl.components.networked.data.owner;
    });
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  },

  block(clientId) {
    if (NAF.connection.adapter) {
      NAF.connection.adapter.block(clientId);
    }
  },

  // Currently unused
  unblock(clientId) {
    if (NAF.connection.adapter) {
      NAF.connection.adapter.unblock(clientId);
    }
    if (NAF.connection.entities) {
      NAF.connection.entities.completeSync(clientId);
    }
  }
});
