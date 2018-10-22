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

      if (this.el.components.body) {
        this.prevBodyType = this.el.components.body.data.type;
      }

      this.el.setAttribute("body", { type: "static" });
      this.el.setAttribute("grabbable", { maxGrabbers: 0 });
    } else {
      if (typeof this.prevMaxGrabbers !== "undefined") {
        this.el.setAttribute("grabbable", { maxGrabbers: this.prevMaxGrabbers });
      }

      if (typeof this.prevBodyType !== "undefined") {
        this.el.setAttribute("body", { type: this.prevBodyType });
      }
    }
  }
});
