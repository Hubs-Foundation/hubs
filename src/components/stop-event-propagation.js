const handler = e => {
  e.stopPropagation();
};

AFRAME.registerComponent("stop-event-propagation", {
  multiple: true,

  schema: {
    event: { type: "string" }
  },

  play() {
    this.el.addEventListener(this.data.event, handler);
  },

  pause() {
    this.el.removeEventListener(this.data.event, handler);
  }
});
