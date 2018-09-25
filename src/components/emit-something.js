AFRAME.registerComponent("emit-something", {
  multiple: true,

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

AFRAME.registerComponent("set-actionset-on-event", {
  multiple: true,

  schema: {
    set: { type: "string" },
    event: { type: "string" },
    activate: { type: "boolean" }
  },

  init() {
    const actions = AFRAME.scenes[0].systems.actions;
    this.el.addEventListener(this.data.event, () => {
      actions[this.data.activate ? "activate" : "deactivate"](this.data.set);
    });
  }
});
