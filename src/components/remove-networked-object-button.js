AFRAME.registerComponent("remove-networked-object-button", {
  init() {
    this.onClick = e => {
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) return;

      // HACK currently superhands does not simulate -end events
      // when an object is removed, so we do it here for now to ensure any
      // super hands who have this element are cleared.
      this.targetEl.dispatchEvent(new window.CustomEvent("hover-end", e));
      this.targetEl.dispatchEvent(new window.CustomEvent("grab-end", e));

      this.targetEl.parentNode.removeChild(this.targetEl);
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
