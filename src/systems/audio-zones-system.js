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

function addZone(entity, zone) {
  entity.currZones.add(zone);
}

function removeZone(entity, zone) {
  entity.currZones.delete(zone);
}

function addOrRemoveZone(position, entity, zone) {
  const isInZone = zone.isEnabled() && zone.contains(position);
  const wasInZone = entity.currZones.has(zone);
  if (isInZone && !wasInZone) {
    addZone(entity, zone);
  } else if (!isInZone && wasInZone) {
    removeZone(entity, zone);
  }
}

function any(set, predicate) {
  for (const item of set) {
    if (predicate(item)) return true;
  }
  return false;
}

function isUpdated(entity) {
  return entity.currZones.size !== entity.prevZones.size || any(entity.currZones, zone => !entity.prevZones.has(zone));
}

const castRay = (function() {
  const direction = new THREE.Vector3();
  return function castRay(ray, from, to) {
    ray.set(from, direction.subVectors(to, from).normalize());
  };
})();

function exclude(zones) {
  return zone => {
    return !zones.includes(zone);
  };
}

function hasIntersection(ray) {
  const intersectTarget = new THREE.Vector3();
  return zone => {
    ray.intersectBox(zone.getBoundingBox(), intersectTarget);
    return intersectTarget !== null;
  };
}
const updateSource = (function() {
  const ray = new THREE.Ray();
  return function updateSource(source, sourcePosition, sourceZones, listenerPosition, listenerZones) {
    castRay(ray, listenerPosition, sourcePosition);

    // First we check the zones the source is contained in and we check the inOut property
    // to modify the sources audio params when the listener is outside the source's zones
    // We always apply the outmost active zone audio params, the zone that's closest to the listener
    const inOutParams = sourceZones.currZones
      .filter(zone => zone.data.inOut)
      .filter(exclude(listenerZones))
      .filter(hasIntersection(ray))
      .map(zone => zone.getAudioParams())
      .reduce(paramsReducer, null);

    // Then we check the zones the listener is contained in and we check the outIn property
    // to modify the sources audio params when the source is outside the listener's zones
    // We always apply the inmost active zone audio params, the zone that's closest to the listener
    const outInParams = listenerZones
      .filter(zone => zone.data.outIn)
      .filter(exclude(sourceZones.currZones))
      .filter(hasIntersection(ray))
      .map(zone => zone.getAudioParams())
      .reduce(paramsReducer, null);

    if (!outInParams && !inOutParams) {
      source.restore();
    } else if (outInParams && !inOutParams) {
      source.apply(outInParams);
    } else if (!outInParams && inOutParams) {
      source.apply(inOutParams);
    } else {
      const params = outInParams;
      params.gain = Math.min(outInParams.gain, inOutParams.gain);
      params.coneOuterAngle = Math.min(outInParams.coneOuterAngle, inOutParams.coneOuterAngle);
      source.apply(params);
    }
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
  constructor() {
    this.listener = null;
    this.listenerEntity = null;
    this.sources = [];
    this.zones = [];
    this.entities = [];
    this.entityZones = new Map();
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
  registerEntity(entity) {
    this.entities.push(entity);
    this.entityZones.set(entity, { currZones: new Set(), prevZones: new Set() });
  }
  unregisterEntity(entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
    this.entityZones.delete(entity);
  }

  tick = (function() {
    const listenerPosition = new THREE.Vector3();
    return function(scene) {
      if (!scene.is("entered")) return;
      const listenerZones = this.entityZones.get(this.listenerEntity);
      this.listener.getWorldPosition(listenerPosition);
      this.zones.forEach(zone => {
        addOrRemoveZone(listenerPosition, listenerZones, zone);
        this.sources.forEach(source => {
          const sourceZones = this.entityZones.get(source.entity);
          addOrRemoveZone(source.getPosition(), sourceZones, zone);
        });
      });

      this.sources
        .filter(source => {
          const sourceZones = this.entityZones.get(source.entity);
          return isUpdated(listenerZones) || isUpdated(sourceZones);
        })
        .forEach(source => {
          const sourceZones = this.entityZones.get(source.entity);
          updateSource(source, source.getPosition(), sourceZones, listenerPosition, listenerZones.currZones);
        });
      this.entityZones.forEach(entity => {
        entity.prevZones.clear();
        entity.currZones.forEach(zone => entity.prevZones.add(zone));
      });
    };
  })();
}
