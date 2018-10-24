AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {},

  update() {
    if (this.data.pinned) {
      if (this.el.components.grabbable) {
        this.prevMaxGrabbers = this.el.components.grabbable.data.maxGrabbers;
      }

      this.el.setAttribute("body", { type: "static" });
      this.el.setAttribute("grabbable", { maxGrabbers: 0 });
      this.el.removeAttribute("stretchable");
      this.el.emit("pinned");
    } else {
      if (typeof this.prevMaxGrabbers !== "undefined") {
        this.el.setAttribute("grabbable", { maxGrabbers: this.prevMaxGrabbers });
      }

      this.el.setAttribute("stretchable");
      this.el.emit("unpinned");
    }
  }
});
