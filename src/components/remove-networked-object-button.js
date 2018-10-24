AFRAME.registerComponent("remove-networked-object-button", {
  init() {
    this.scene = document.querySelector("a-scene");

    this.onClick = () => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      this.targetEl.parentNode.removeChild(this.targetEl);
      this.scene.emit("action_freeze");
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  }
});
