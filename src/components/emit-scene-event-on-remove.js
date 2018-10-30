AFRAME.registerComponent("emit-scene-event-on-remove", {
  schema: {
    event: { default: null }
  },

  remove() {
    if (this.data.event) {
      this.el.sceneEl.emit(this.data.event, { el: this.el });
    }
  }
});
