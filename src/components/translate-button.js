import { subtitleSystem } from "../bit-systems/subtitling-system";

/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-button
 */
AFRAME.registerComponent("translate-button", {
  init() {
    this.onClick = () => {
      subtitleSystem.SelectTarget(this.owner);
    };
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.owner = networkedEl.components.networked.data.owner;
    });
    this.onTargetUpdate = event => {
      const text = this.el.querySelector(".translate-button-text").object3D;
      if (event.detail.owner === this.owner) {
        text.el.setAttribute("text", {
          value: "Stop"
        });
      } else {
        text.el.setAttribute("text", {
          value: "Translate"
        });
      }
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    APP.scene.addEventListener("translation-target-updated", this.onTargetUpdate);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
