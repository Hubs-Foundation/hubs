/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-badge
 */

AFRAME.registerComponent("translate-badge", {
  init() {
    this.onClick = () => {
      APP.scene.emit("translation_updates_available", { type: "stop" });
      console.log("emiting type stop");
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
