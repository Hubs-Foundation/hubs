AFRAME.registerComponent("drop-object-button", {
  init() {
    this.onClick = () => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      this.targetEl.setAttribute("floaty-object", { modifyGravityOnRelease: false });
      this.targetEl.setAttribute("ammo-body", {
        type: "dynamic",
        gravity: { x: 0, y: -9.8, z: 0 },
        angularDamping: 0.01,
        linearDamping: 0.01,
        linearSleepingThreshold: 1.6,
        angularSleepingThreshold: 2.5
      });
      this.targetEl.components["ammo-body"].body.activate();

      // Remove drop button after using it
      this.el.parentNode.removeChild(this.el);
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
