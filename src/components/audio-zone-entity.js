/**
 * Represents an entity in the audio-zones-system.
 * Records the audio zones where the entity is and returns current/past states.
 * This entity is used together with the audio-zone-listeneror audio-zone-source components to composite actual entities.
 **/
AFRAME.registerComponent("audio-zone-entity", {
  init() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.registerEntity(this);
  },

  remove() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.unregisterEntity(this);
  }
});
