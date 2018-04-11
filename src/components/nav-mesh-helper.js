AFRAME.registerComponent("nav-mesh-helper", {
  schema: {
    teleportControls: { type: "selectorAll", default: "[teleport-controls]" }
  },

  init: function() {
    const teleportControls = this.data.teleportControls;
    this.el.addEventListener("bundleloaded", () => {
      if (!teleportControls) return;

      for (let i = 0; i < teleportControls.length; i++) {
        teleportControls[i].components["teleport-controls"].queryCollisionEntities();
      }
    });
  }
});
