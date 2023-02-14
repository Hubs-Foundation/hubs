import { addComponent, defineQuery, enterQuery, exitQuery, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioZone, AudioListenerTag, AudioDebugChanged } from "../bit-components";
import { Box3, BoxGeometry, DoubleSide, MeshBasicMaterial, Object3D, Ray, Vector3, Mesh, BoxHelper } from "three";
import { AUDIO_ZONE_FLAGS } from "../inflators/audio-zone";
import { disposeNode } from "../utils/three-utils";
import { AudioSettings } from "../components/audio-params";
import { updateAudioSettings } from "../update-audio-settings";
import { waitForDOMContentLoaded } from "../utils/async-utils";

const debugObjects = new Map<number, Object3D>();

const DEBUG_BBAA_COLOR = 0x49ef4;

const debugMaterial = new MeshBasicMaterial({
  color: DEBUG_BBAA_COLOR,
  transparent: true,
  opacity: 0.25,
  side: DoubleSide
});

waitForDOMContentLoaded().then(() => {
  (APP.store as any).addEventListener("statechanged", () => {
    audioZoneQuery(APP.world).forEach(zone => {
      addComponent(APP.world, AudioDebugChanged, zone);
    });
  });
});

const addZoneDebugObject = (world: HubsWorld, zone: number) => {
  const geometry = new BoxGeometry();
  const mesh = new Mesh(geometry, debugMaterial);
  const helper = new BoxHelper(mesh, DEBUG_BBAA_COLOR);

  const parent = world.eid2obj.get(zone) as Object3D;
  parent.add(helper);
  parent.updateMatrixWorld(true);

  debugObjects.set(zone, helper);
};

const releaseZoneDebugObject = (world: HubsWorld, zone: number) => {
  const helper = debugObjects.get(zone)!;
  helper?.removeFromParent();
  disposeNode(helper);
  debugObjects.delete(zone);
};

const isZoneEnabled = (zone: number): boolean => {
  return Boolean(AudioZone.flags[zone] & AUDIO_ZONE_FLAGS.ENABLED);
};

const getZoneBoundingBox = (zone: number) => {
  if (AudioZone.flags[zone] & AUDIO_ZONE_FLAGS.DYNAMIC) {
    const obj = APP.world.eid2obj.get(zone)!;
    return aabbs.get(zone)!.setFromObject(obj);
  } else {
    return aabbs.get(zone)!;
  }
};

const zoneContains = (zone: number, position: Vector3) => {
  return getZoneBoundingBox(zone).containsPoint(position);
};

const getZoneAudioParams = (zone: number) => {
  return APP.audioOverrides.get(zone);
};

type AnyPredicate = (zone: number) => boolean;
const any = (set: Set<number>, predicate: AnyPredicate) => {
  for (const item of set) {
    if (predicate(item)) return true;
  }
  return false;
};

const isUpdated = (currZones: Set<number>, prevZones: Set<Number>) => {
  return currZones && prevZones && (currZones.size !== prevZones.size || any(currZones, zone => !prevZones.has(zone)));
};

const getSourcePosition = (() => {
  const pos = new Vector3();
  return (source: number) => {
    const audio = APP.audios.get(source);
    if (audio) {
      audio.getWorldPosition(pos);
    } else {
      pos.set(0, 0, 0);
    }
    return pos;
  };
})();

const applySourceParams = (source: number, params: AudioSettings) => {
  APP.zoneOverrides.set(source, params);
  const audio = APP.audios.get(source);
  if (audio) {
    updateAudioSettings(source, audio);
  }
};

const restoreSourceParams = (source: number) => {
  APP.zoneOverrides.delete(source);
  const audio = APP.audios.get(source);
  if (audio) {
    updateAudioSettings(source, audio);
  }
};

const setRay = (() => {
  const direction = new Vector3();
  return (ray: Ray, from: Vector3, to: Vector3) => {
    ray.set(from, direction.subVectors(to, from).normalize());
  };
})();

const exclude = (zones: Set<number>) => {
  return (zone: number) => {
    return !zones.has(zone);
  };
};

const hasIntersection = (ray: Ray) => {
  const intersectTarget = new Vector3();
  return (zone: number) => {
    ray.intersectBox(getZoneBoundingBox(zone), intersectTarget);
    return intersectTarget !== null;
  };
};

const updateSource = (() => {
  const ray = new Ray();
  return (
    source: number,
    sourcePosition: Vector3,
    sourceZones: Set<number>,
    listenerPosition: Vector3,
    listenerZones: Set<number>
  ) => {
    setRay(ray, listenerPosition, sourcePosition);

    // TODO: Reimplement the desired sorting of zones
    const inOutParams = Array.from(sourceZones)
      .filter(zone => AudioZone.flags[zone] & AUDIO_ZONE_FLAGS.IN_OUT)
      .filter(exclude(listenerZones))
      .filter(hasIntersection(ray))
      .map(zone => getZoneAudioParams(zone))
      .reduce(paramsReducer, null);

    // TODO: Reimplement the desired sorting of zones
    const outInParams = Array.from(listenerZones)
      .filter(zone => AudioZone.flags[zone] & AUDIO_ZONE_FLAGS.OUT_IN)
      .filter(exclude(sourceZones))
      .filter(hasIntersection(ray))
      .map(zone => getZoneAudioParams(zone))
      .reduce(paramsReducer, null);

    if (!outInParams && !inOutParams) {
      restoreSourceParams(source);
    } else if (outInParams && !inOutParams) {
      applySourceParams(source, outInParams);
    } else if (!outInParams && inOutParams) {
      applySourceParams(source, inOutParams);
    } else {
      // In this case two zones ar acting over the same source simultaneously.
      // We apply the closest zone params with the lowest gain
      applySourceParams(
        source,
        Object.assign(
          {},
          inOutParams,
          outInParams,
          paramsReducer(
            {
              gain: outInParams?.gain
            },
            {
              gain: inOutParams?.gain
            }
          )
        )
      );
    }
  };
})();

const REDUCED_KEYS = [
  "gain",
  "maxDistance",
  "refDistance",
  "rolloffFactor",
  "coneInnerAngle",
  "coneOuterAngle",
  "coneOuterGain"
] as const;
type ReducedAudioSettingsKeys = typeof REDUCED_KEYS[number];
type ReducedAudioSettings = Pick<AudioSettings, ReducedAudioSettingsKeys>;

// We apply the most restrictive audio parameters
const paramsReducer = (acc: AudioSettings, curr: AudioSettings): AudioSettings => {
  if (!curr && !acc) return {} as AudioSettings;
  else if (curr && !acc) return curr;
  else if (!curr && acc) return acc;
  else
    return REDUCED_KEYS.reduce((result: ReducedAudioSettings, key: ReducedAudioSettingsKeys): AudioSettings => {
      if (curr[key] !== undefined && acc[key] !== undefined) {
        result[key] = Math.min(acc[key]!, curr[key]!);
      } else if (curr[key] !== undefined && acc[key] === undefined) {
        result[key] = curr[key];
      } else if (curr[key] === undefined && acc[key] !== undefined) {
        result[key] = acc[key];
      }
      return result;
    }, {});
};

const addOrRemoveZone = (zones: Set<number>, zone: number, position: Vector3) => {
  if (!zones) return;
  const isInZone = isZoneEnabled(zone) && zoneContains(zone, position);
  const wasInZone = zones.has(zone);
  if (isInZone && !wasInZone) {
    zones.add(zone);
  } else if (!isInZone && wasInZone) {
    zones.delete(zone);
  }
};

const currZones = new Map<number, Set<number>>();
const prevZones = new Map<number, Set<number>>();
const aabbs = new Map<number, Box3>();

const listenerPos = new Vector3();
const audioZoneQuery = defineQuery([AudioZone]);
const audioZoneEnterQuery = enterQuery(audioZoneQuery);
const audioZoneExitQuery = exitQuery(audioZoneQuery);
const audioZoneSourceQuery = defineQuery([AudioEmitter]);
const audioZoneSourceEnterQuery = enterQuery(audioZoneSourceQuery);
const audioZoneSourceExitQuery = exitQuery(audioZoneSourceQuery);
const audioZoneListenerQuery = defineQuery([AudioListenerTag]);
const audioZoneListenerEnterQuery = enterQuery(audioZoneListenerQuery);
const audioZoneListenerExitQuery = exitQuery(audioZoneListenerQuery);
const audioZoneDebugQuery = defineQuery([AudioZone, AudioDebugChanged]);

export function audioZoneSystem(world: HubsWorld) {
  [...audioZoneSourceEnterQuery(world), ...audioZoneListenerEnterQuery(world)].forEach(entity => {
    currZones.set(entity, new Set());
    prevZones.set(entity, new Set());
  });
  [...audioZoneSourceExitQuery(world), ...audioZoneListenerExitQuery(world)].forEach(entity => {
    currZones.delete(entity);
    prevZones.delete(entity);
  });

  audioZoneEnterQuery(world).forEach(zone => {
    const obj = APP.world.eid2obj.get(zone)!;
    const aabb = new Box3();
    aabb.setFromObject(obj);
    aabbs.set(zone, aabb);
  });
  audioZoneExitQuery(world).forEach(zone => {
    aabbs.delete(zone);
    debugObjects.delete(zone);
  });

  const listener = APP.audioListener.eid!;
  const zones = audioZoneQuery(world);
  const listenersQuery = audioZoneListenerQuery(world);
  const sourcesQuery = audioZoneSourceQuery(world);

  zones.forEach(zone => {
    APP.audioListener.getWorldPosition(listenerPos);
    addOrRemoveZone(currZones.get(listener)!, zone, listenerPos);
    sourcesQuery.forEach((source: number) => {
      addOrRemoveZone(currZones.get(source)!, zone, getSourcePosition(source));
    });
  });

  sourcesQuery.forEach(source => {
    const isListenerUpdated = isUpdated(currZones.get(listener)!, prevZones.get(listener)!);
    const isSourceUpdated = isUpdated(currZones.get(source)!, prevZones.get(source)!);
    if (isListenerUpdated || isSourceUpdated) {
      updateSource(source, getSourcePosition(source), currZones.get(source)!, listenerPos, currZones.get(listener)!);
    }
  });

  [...sourcesQuery, ...listenersQuery].forEach(entity => {
    const zones = prevZones.get(entity);
    if (zones) {
      zones.clear();
      currZones.get(entity)?.forEach(zone => zones.add(zone));
    }
  });
  audioZoneDebugQuery(world).forEach(zone => {
    const shouldShowDebug =
      AudioZone.flags[zone] & AUDIO_ZONE_FLAGS.DEBUG && APP.store.state.preferences.showAudioDebugPanel;
    if (shouldShowDebug) {
      !debugObjects.has(zone) && addZoneDebugObject(world, zone);
    } else {
      debugObjects.has(zone) && releaseZoneDebugObject(world, zone);
    }
    removeComponent(world, AudioDebugChanged, zone);
  });
}
