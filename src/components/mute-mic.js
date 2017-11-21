const bindAllEvents = function(elements, events, f) {
  if (!elements || !elements.length) return;
  for (var el of elements) {
    events.length &&
      events.forEach(e => {
        el.addEventListener(e, f);
      });
  }
};
const unbindAllEvents = function(elements, events, f) {
  if (!elements || !elements.length) return;
  for (var el of elements) {
    events.length &&
      events.forEach(e => {
        el.removeEventListener(e, f);
      });
  }
};

AFRAME.registerComponent("mute-mic", {
  schema: {
    eventSrc: { type: "selectorAll" },
    toggleEvents: { type: "array" },
    muteEvents: { type: "array" },
    unmuteEvents: { type: "array" }
  },
  init: function() {
    this.onToggle = this.onToggle.bind(this);
    this.onMute = this.onMute.bind(this);
    this.onUnmute = this.onUnmute.bind(this);
  },

  play: function() {
    const { eventSrc, toggleEvents, muteEvents, unmuteEvents } = this.data;
    bindAllEvents(eventSrc, toggleEvents, this.onToggle);
    bindAllEvents(eventSrc, muteEvents, this.onMute);
    bindAllEvents(eventSrc, unmuteEvents, this.onUnmute);
  },

  pause: function() {
    const { eventSrc, toggleEvents, muteEvents, unmuteEvents } = this.data;
    unbindAllEvents(eventSrc, toggleEvents, this.onToggle);
    unbindAllEvents(eventSrc, muteEvents, this.onMute);
    unbindAllEvents(eventSrc, unmuteEvents, this.onUnmute);
  },

  onToggle: function() {
    if (this.el.is("muted")) {
      NAF.connection.adapter.enableMicrophone(true);
      this.el.removeState("muted");
    } else {
      NAF.connection.adapter.enableMicrophone(false);
      this.el.addState("muted");
    }
  },

  onMute: function() {
    if (!this.el.is("muted")) {
      NAF.connection.adapter.enableMicrophone(false);
      this.el.addState("muted");
    }
  },

  onUnmute: function() {
    if (this.el.is("muted")) {
      NAF.connection.adapter.enableMicrophone(true);
      this.el.removeState("muted");
    }
  }
});
