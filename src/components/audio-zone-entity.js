function any(set, predicate) {
  for (const item of set) {
    if (predicate(item)) return true;
  }
  return false;
}
/**
 * Represents an entity in the audio-zones-system.
 * Records the audio zones where the entity is and returns current/past states.
 * This entity is used together with the audio-zone-listeneror audio-zone-source components to composite actual entities.
 **/
AFRAME.registerComponent("audio-zone-entity", {
  init() {
    this.currZones = new Set();
    this.prevZones = new Set();
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.registerEntity(this);
  },

  remove() {
    this.currZones.clear();
    this.prevZones.clear();
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.unregisterEntity(this);
  },

  isUpdated() {
    return this.currZones.size !== this.prevZones.size || any(this.currZones, zone => !this.prevZones.has(zone));
  }
});
