/**
 * Represents the scene audio listener in the audio-zones-system.
 */
AFRAME.registerComponent("audio-zone-listener", {
  init() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.registerListener(this.el.sceneEl.audioListener);
  },

  remove() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.clearListener(this.el.sceneEl.audioListener);
  }
});
