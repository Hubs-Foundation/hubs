/**
 * Initializes teleporters when the environment bundle has loaded.
 * @namespace environment
 * @component nav-mesh-helper
 */
AFRAME.registerComponent("nav-mesh-helper", {
  init: function() {
    this.el.addEventListener("model-loaded", () => {
      const teleporters = document.querySelectorAll("[teleporter]");
      for (let i = 0; i < teleporters.length; i++) {
        teleporters[i].components["teleporter"].queryCollisionEntities();
      }
    });
  }
});
