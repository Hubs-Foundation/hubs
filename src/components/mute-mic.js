import { SOUND_TOGGLE_MIC } from "../systems/sound-effects-system";

const bindAllEvents = function(elements, events, f) {
  if (!elements || !elements.length) return;
  for (const el of elements) {
    events.length &&
      events.forEach(e => {
        el.addEventListener(e, f);
      });
  }
};
const unbindAllEvents = function(elements, events, f) {
  if (!elements || !elements.length) return;
  for (const el of elements) {
    events.length &&
      events.forEach(e => {
        el.removeEventListener(e, f);
      });
  }
};

/**
 * Toggles the microphone on the current network connection based on the given events.
 * @namespace network
 * @component mute-mic
 */
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
    this.store = window.APP.store;
    this.store.addEventListener("statechanged", this.onStoreUpdated.bind(this));
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
    if (!NAF.connection.adapter) return;
    if (!this.el.sceneEl.is("entered")) return;

    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_TOGGLE_MIC);
    if (this.el.is("muted")) {
      NAF.connection.adapter.enableMicrophone(true);
    } else {
      NAF.connection.adapter.enableMicrophone(false);
    }
  },

  onMute: function() {
    if (!NAF.connection.adapter) return;
    if (!this.el.is("muted")) {
      NAF.connection.adapter.enableMicrophone(false);
    }
  },

  onUnmute: function() {
    if (this.el.is("muted")) {
      NAF.connection.adapter.enableMicrophone(true);
    }
  },

  onStoreUpdated: function() {
    const micMuted = this.store.state.settings["micMuted"];
    const isMicShared = window.APP.mediaDevicesManager?.isMicShared;
    if (micMuted !== undefined) {
      if (isMicShared) {
        if (micMuted) {
          this.el.addState("muted");
        } else {
          this.el.removeState("muted");
        }
      } else {
        this.el.addState("muted");
      }
    }
  }
});
