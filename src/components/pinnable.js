AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {},

  update() {
    this.el.setAttribute("grabbable", { maxGrabbers: this.data.pinned ? 0 : 1 });

    if (this.data.pinned) {
      this.el.setAttribute("body", { type: "static" });
    }
  }
});
