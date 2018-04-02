AFRAME.registerComponent("lifecycle-checker", {
  schema: {
    name: { type: "string" },
    tick: { default: false }
  },
  init: function() {
    this.log("init");
  },
  update: function() {
    this.log("update");
  },
  tick: function() {
    if (this.data.tick) {
      this.log("tick");
    }
  },
  remove: function() {
    this.log("remove");
  },
  pause: function() {
    this.log("pause");
  },
  play: function() {
    this.log("play");
  },

  log: function(method) {
    console.info(`lifecycle-checker:${this.data.name} ${method}`);
  }
});
