const handler = e => {
  e.stopPropagation();
  e.preventDefault();
};

AFRAME.registerComponent("stop-event-propagation", {
  multiple: true,

  schema: {
    event: { type: "string" }
  },

  play() {
    console.log("HELLO " + this.data.event);
    this.el.addEventListener(this.data.event, handler);
  },

  pause() {
    this.el.removeEventListener(this.data.event, handler);
  }
});
