/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-badge
 */

AFRAME.registerComponent("translate-badge", {
  init() {
    this.onTargetUpdate = this.onTargetUpdate.bind(this);
    this.onTranslationStopped = this.onTranslationStopped.bind(this);
    this.el.object3D.visible = false;
    this.onClick = () => {
      APP.scene.emit("translation_updates_available", { type: "stop" });
    };

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        this.playerSessionId = NAF.utils.getCreator(networkedEl);
        this.owner = networkedEl.components.networked.data.owner;
      })
      .catch(error => console.log(error));
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    window.APP.scene.addEventListener("translation-target-updated", this.onTargetUpdate);
    window.APP.scene.addEventListener("translation-stopped", this.onTranslationStopped);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    window.APP.scene.removeEventListener("translation-target-updated", this.onTargetUpdate);
    window.APP.scene.removeEventListener("translation-stopped", this.onTranslationStopped);
  },

  onTargetUpdate(event) {
    console.log("badge", event.detail.owner, this.owner, event.detail.owner === this.owner);
    this.el.object3D.visible = event.detail.owner === this.owner;
    console.log(this.el.object3D);
  },
  onTranslationStopped() {
    this.el.object3D.visible = false;
  }
});
