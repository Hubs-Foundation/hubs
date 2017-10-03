AFRAME.registerComponent("mute-mic", {
  schema: {
    eventSrc: { type: "selectorAll" },
    toggleEvent: { type: "string" },
    muteEvent: { type: "string" },
    unmuteEvent: { type: "string" }
  },
  init: function() {
    var eventSrcElements = this.data.eventSrc || [this.el];

    this.onToggle = this.onToggle.bind(this);
    this.onMute = this.onMute.bind(this);
    this.onUnmute = this.onUnmute.bind(this);

    for (var el of eventSrcElements) {
      if (this.data.toggleEvent !== "") {
        el.addEventListener(this.data.toggleEvent, this.onToggle, false);
      }

      if (this.data.muteEvent !== "") {
        el.addEventListener(this.data.muteEvent, this.onMute, false);
      }

      if (this.data.unmuteEvent !== "") {
        el.addEventListener(this.data.unmuteEvent, this.onUnmute, false);
      }
    }
  },

  onToggle: function () {
    if (this.el.is('muted')) {
      NAF.connection.adapter.enableMicrophone(true);
      this.el.removeState('muted');
    } else {
      NAF.connection.adapter.enableMicrophone(false);
      this.el.addState('muted');
    }
  },

  onMute: function () {
    if (!this.el.is('muted')) {
      NAF.connection.adapter.enableMicrophone(false);
      this.el.addState('muted');
    }
  },

  onUnmute: function () {
    if (this.el.is('muted')) {
      NAF.connection.adapter.enableMicrophone(true);
      this.el.removeState('muted');
    }
  }
});
