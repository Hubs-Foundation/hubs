// We apply the most restrictive audio parameters
function paramsReducer(acc, curr) {
  if (acc === null) acc = curr;
  acc.gain = Math.min(acc.gain, curr.gain);
  acc.maxDistance = Math.min(acc.maxDistance, curr.maxDistance);
  acc.refDistance = Math.min(acc.refDistance, curr.refDistance);
  acc.rolloffFactor = Math.max(acc.rolloffFactor, curr.rolloffFactor);
  acc.coneInnerAngle = Math.min(acc.coneInnerAngle, curr.coneInnerAngle);
  acc.coneOuterAngle = Math.min(acc.coneOuterAngle, curr.coneOuterAngle);
  acc.coneOuterGain = Math.min(acc.coneOuterGain, curr.coneOuterGain);
  return acc;
}

function addOrRemoveZone(position, entity, zone) {
  const isInZone = zone.isEnabled() && zone.contains(position);
  const wasInZone = entity.isInZone(zone);
  if (isInZone && !wasInZone) {
    entity.addZone(zone);
  } else if (!isInZone && wasInZone) {
    entity.removeZone(zone);
  }
}

function updateZones(sources, listenerPosition, listenerEntity, zones) {
  zones.forEach(zone => {
    addOrRemoveZone(listenerPosition, listenerEntity, zone);
    sources.forEach(source => {
      addOrRemoveZone(source.getPosition(), source.entity, zone);
    });
  });
}

const castRay = (function() {
  const direction = new THREE.Vector3();
  return function castRay(ray, from, to) {
    ray.set(from, direction.subVectors(to, from).normalize());
  };
})();

/**
 * This system updates the audio-zone-sources audio-params based on the audio-zone-listener position.
 * On every tick it computes the audio-zone-source and audio-zone-listener positions to check
 * if the listener is inside/outside an audio-zone and applies the zone's audio parameters based.
 * It only updates in case there has been any changes in the sources or listener's positions.
 * If several audio-zones are in between the audio-zone-listener and the audio-zone-source, the applied
 * audio parameters is a reduction of the audio-zones most restrictive audio parameters.
 * i.e. If there are two audio-zones in between the listener and the source and the first one has gain == 0.1
 * and the other has gain == 1.0, gain == 0.1 is applied to the source.
 */
export class AudioZonesSystem {
  constructor(scene) {
    this.scene = scene;
    this.listener = null;
    this.listenerEntity = null;
    this.sources = [];
    this.zones = [];
  }

  registerSource(source) {
    this.sources.push(source);
  }
  unregisterSource(source) {
    this.sources.splice(this.sources.indexOf(source), 1);
  }
  registerZone(zone) {
    this.zones.push(zone);
  }
  unregisterZone(zone) {
    // TODO: Remove this zone from all the entities (sources and listenerEntity)
    this.zones.splice(this.zones.indexOf(zone), 1);
  }

  tick = (function() {
    const ray = new THREE.Ray();
    const intersectTarget = new THREE.Vector3();
    const listenerPosition = new THREE.Vector3();
    return function() {
      if (!this.scene.is("entered")) return;

      this.listener.getWorldPosition(listenerPosition);

      updateZones(this.sources, listenerPosition, this.listenerEntity, this.zones);

      this.sources.forEach(source => {
        if (!source.entity.isUpdated() && !this.listenerEntity.isUpdated()) return;
        castRay(ray, listenerPosition, source.getPosition());

        // First we check the zones the source is contained in and we check the inOut property
        // to modify the sources audio params when the listener is outside the source's zones
        // We always apply the outmost active zone audio params, the zone that's closest to the listener
        const inOutParams = source.entity
          .getZones()
          .filter(zone => {
            const zoneBBAA = zone.getBoundingBox();
            ray.intersectBox(zoneBBAA, intersectTarget);
            return intersectTarget !== null && zone.data.inOut && !this.listenerEntity.getZones().includes(zone);
          })
          .map(zone => zone.getAudioParams())
          .reduce(paramsReducer, null);

        // Then we check the zones the listener is contained in and we check the outIn property
        // to modify the sources audio params when the source is outside the listener's zones
        // We always apply the inmost active zone audio params, the zone that's closest to the listener
        const outInParams = this.listenerEntity
          .getZones()
          .filter(zone => {
            const zoneBBAA = zone.getBoundingBox();
            ray.intersectBox(zoneBBAA, intersectTarget);
            return intersectTarget !== null && zone.data.outIn && !source.entity.getZones().includes(zone);
          })
          .map(zone => zone.getAudioParams())
          .reduce(paramsReducer, null);

        // Resolve the zones
        if (outInParams || inOutParams) {
          const params = outInParams ? outInParams : inOutParams;
          params.gain = outInParams && inOutParams ? Math.min(outInParams.gain, inOutParams.gain) : params.gain;
          params.coneOuterGain =
            outInParams && inOutParams
              ? Math.min(outInParams.coneOuterGain, inOutParams.coneOuterGain)
              : params.coneOuterGain;
          source.apply(params);
        } else {
          source.restore();
        }
      });
    };
  })();
}
