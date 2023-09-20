/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-button
 */
AFRAME.registerComponent("translate-button", {
  init() {
    this.onClick = () => {
      this.translate(this.owner);
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

  translate(clientId) {
    console.log("translating: ", clientId);
    // window.APP.hubChannel.hide(clientId);
  }
});
