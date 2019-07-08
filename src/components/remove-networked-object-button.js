AFRAME.registerComponent("remove-networked-object-button", {
  init() {
    this.onClick = () => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      this.targetEl.setAttribute("animation__remove", {
        property: "scale",
        dur: 200,
        to: { x: 0.01, y: 0.01, z: 0.01 },
        easing: "easeInQuad"
      });

      this.el.parentNode.removeAttribute("visibility-while-frozen");
      this.el.parentNode.setAttribute("visible", false);

      this.targetEl.addEventListener("animationcomplete", () => {
        NAF.utils.takeOwnership(this.targetEl);
        this.targetEl.parentNode.removeChild(this.targetEl);
      });
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
