/**
 * Represents the scene audio listener in the audio-zones-system.
 */
AFRAME.registerComponent("audio-zone-listener", {
  init() {
    const system = this.el.sceneEl.systems["hubs-systems"].audioZonesSystem;
    system.listener = this.el.sceneEl.audioListener;
    system.listenerEntity = this;
    system.registerEntity(this);
  },

  remove() {
    const system = this.el.sceneEl.systems["hubs-systems"].audioZonesSystem;
    system.listener = null;
    system.listenerEntity = null;
    system.unregisterEntity(this);
  }
});
