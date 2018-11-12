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

      this.el.parentNode.removeAttribute("visible-while-frozen");
      this.el.parentNode.setAttribute("visible", false);

      this.targetEl.addEventListener("animationcomplete", () => {
        this.targetEl.parentNode.removeChild(this.targetEl);
      });
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
