AFRAME.registerComponent("emit-state-change", {
  multiple: true,
  schema: {
    state: { type: "string" },
    transform: { type: "string", oneof: ["rising", "falling"] },
    event: { type: "string" }
  },

  init() {
    this.stateadded = this.stateadded.bind(this);
    this.stateremoved = this.stateremoved.bind(this);
  },

  stateadded(e) {
    if (e.detail === this.data.state) {
      this.el.emit(this.data.event);
    }
  },
  stateremoved(e) {
    if (e.detail === this.data.state) {
      this.el.emit(this.data.event);
    }
  },

  update() {
    this.el.removeEventListener("stateadded", this.stateadded);
    this.el.removeEventListener("stateremoved", this.stateremoved);

    if (this.data.transform === "rising") {
      this.el.addEventListener("stateadded", this.stateadded);
    }
    if (this.data.transform === "falling") {
      this.el.addEventListener("stateremoved", this.stateremoved);
    }
  }
});
