AFRAME.registerComponent("emit-something", {
  schema: {
    path: { type: "string" },
    event: { type: "string" }
  },

  tick() {
    const actions = AFRAME.scenes[0].systems.actions;
    if (actions.poll(this.data.path)) {
      this.el.emit(this.data.event);
    }
  }
});
