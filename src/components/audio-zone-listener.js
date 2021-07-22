/**
 * Represents the scene audio listener in the audio-zones-system.
 */
AFRAME.registerComponent("audio-zone-listener", {
  dependencies: ["audio-zone-entity"],

  init() {
    this.listener = this.el.sceneEl?.audioListener;
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.listener = this;
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.listenerEntity = this.el.components["audio-zone-entity"];
  },

  remove() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.listener = null;
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.listenerEntity = null;
  }
});
