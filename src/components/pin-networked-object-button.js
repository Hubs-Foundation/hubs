AFRAME.registerComponent("pin-networked-object-button", {
  init() {
    this.scene = document.querySelector("a-scene");

    this.onClick = () => {
      this.targetEl.setAttribute("pinned", "");
      this.scene.emit("object_pinned", { el: this.targetEl });
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => (this.targetEl = networkedEl));
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  }
});
