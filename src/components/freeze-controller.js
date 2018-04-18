AFRAME.registerComponent("freeze-controller", {
  schema: {
    toggleEvent: { type: "string" }
  },

  init: function() {
    this.onToggle = this.onToggle.bind(this);
  },

  play: function() {
    this.el.addEventListener(this.data.toggleEvent, this.onToggle);
  },

  pause: function() {
    this.el.removeEventListener(this.data.toggleEvent, this.onToggle);
  },

  onToggle: function() {
    window.APP.store.update({ profile: { has_found_freeze: true } });
    NAF.connection.adapter.toggleFreeze();
    if (NAF.connection.adapter.frozen) {
      this.el.addState("frozen");
    } else {
      this.el.removeState("frozen");
    }
  }
});
