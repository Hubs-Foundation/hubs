AFRAME.registerComponent("block-button", {
  init() {
    this.el.addEventListener("click", this.onClick);
    const owner = (function getOwner(el) {
      if (el.firstUpdateData) {
        return el.firstUpdateData.owner;
      }
      if (el.parentEl) {
        return getOwner(el.parentEl);
      }
      return null;
    })(this.el);

    this.onClick = () => {
      console.log("blockUser " + owner);
    };
  }
});
