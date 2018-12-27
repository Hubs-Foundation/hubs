/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component block-button
 */
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
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  },

  block(clientId) {
    NAF.connection.adapter.block(clientId);
  },

  // Currently unused
  unblock(clientId) {
    NAF.connection.adapter.unblock(clientId);
    NAF.connection.entities.completeSync(clientId);
  }
});
