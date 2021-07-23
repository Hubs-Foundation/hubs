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
    this.zones = new Set();
    this.prevZones = new Set();
  },

  remove() {
    this.zones.clear();
    this.prevZones.clear();
  },

  tock() {
    this.prevZones.clear();
    this.zones.forEach(zone => this.prevZones.add(zone));
  },

  addZone(zone) {
    this.zones.add(zone);
  },

  // Removes a zone from the current zones array.
  removeZone(zone) {
    this.zones.delete(zone);
  },

  // Returns true if this entity is inside a zone.
  isInZone(zone) {
    return this.zones.has(zone);
  },

  // Returns true if this entity was inside the zone in the previous tick.
  wasInZone(zone) {
    return this.prevZones.has(zone);
  },

  // Returns true if the entity has change zones (a zone has been added or removes in the last tick).
  isUpdated() {
    return this.zones.size !== this.prevZones.size || any(this.zones, zone => !this.prevZones.has(zone));
  }
});
