AFRAME.registerComponent("lifecycle-checker", {
  schema: {
    tick: { default: false }
  },
  init: function() {
    console.log("init", this.el);
  },
  update: function() {
    console.log("update", this.el);
  },
  tick: function() {
    if (this.data.tick) {
      console.log("tick", this.el);
    }
  },
  remove: function() {
    console.log("remove", this.el);
  },
  pause: function() {
    console.log("pause", this.el);
  },
  play: function() {
    console.log("play", this.el);
  }
});
