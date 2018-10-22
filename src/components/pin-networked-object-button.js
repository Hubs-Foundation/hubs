AFRAME.registerComponent("pin-networked-object-button", {
  schema: {
    labelSelector: { type: "string" },
    hideWhenPinnedSelector: { type: "string" }
  },

  init() {
    this.scene = document.querySelector("a-scene");
    this.labelEl = this.el.parentNode.querySelector(this.data.labelSelector);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => (this.targetEl = networkedEl));

    this.onClick = () => {
      let pinned = false;

      if (this.targetEl.components.pinnable) {
        pinned = this.targetEl.components.pinnable.data.pinned;
      }

      if (!pinned) {
        this.el.parentNode.setAttribute("clickable", "");
        this.labelEl.setAttribute("text", { value: "un-pin" });
        this.scene.emit("object_pinned", { el: this.targetEl });
      } else {
        this.el.parentNode.removeAttribute("clickable");
        this.labelEl.setAttribute("text", { value: "pin" });
        this.scene.emit("object_unpinned", { el: this.targetEl });
      }

      this.targetEl.setAttribute("pinnable", { pinned: !pinned });

      this.el.parentNode.querySelectorAll(this.data.hideWhenPinnedSelector).forEach(hideEl => {
        hideEl.setAttribute("visible", pinned);
      });
    };
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  }
});
