AFRAME.registerComponent("pin-networked-object-button", {
  schema: {
    labelSelector: { type: "string" }
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
        this.targetEl.setAttribute("pinnable", { pinned: true });
        this.labelEl.setAttribute("text", { value: "pinned" });
        this.scene.emit("object_pinned", { el: this.targetEl });
      } else {
        this.el.parentNode.removeAttribute("clickable");
        this.targetEl.setAttribute("pinnable", { pinned: false });
        this.labelEl.setAttribute("text", { value: "unpinned" });
        this.scene.emit("object_unpinned", { el: this.targetEl });
      }
    };
  },

  play() {
    this.el.addEventListener("click", this.onClick);
  },

  pause() {
    this.el.removeEventListener("click", this.onClick);
  }
});
