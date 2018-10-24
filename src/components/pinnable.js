AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this.scene = document.querySelector("a-scene");
  },

  update() {
    if (this.data.pinned) {
      if (this.el.components.grabbable) {
        this.prevMaxGrabbers = this.el.components.grabbable.data.maxGrabbers;
      }

      this.el.setAttribute("body", { type: "static" });
      this.el.setAttribute("grabbable", { maxGrabbers: 0 });
      this.el.removeAttribute("stretchable");
      this.el.emit("pinned");
      this.scene.emit("object_pinned", { el: this.targetEl });
    } else {
      if (typeof this.prevMaxGrabbers !== "undefined") {
        this.el.setAttribute("grabbable", { maxGrabbers: this.prevMaxGrabbers });
      }

      this.el.setAttribute("stretchable");
      this.el.emit("unpinned");
      this.scene.emit("object_unpinned", { el: this.targetEl });
    }
  }
});
