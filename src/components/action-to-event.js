AFRAME.registerComponent("action-to-event", {
  multiple: true,

  schema: {
    path: { type: "string" },
    event: { type: "string" }
  },

  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.readFrameValueAtPath(this.data.path)) {
      this.el.emit(this.data.event);
    }
  }
});
