import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { getScene, HubsWorld } from "../app";
import { AudioEmitter, AudioZone } from "../bit-components";
import { Box3, BoxGeometry, DoubleSide, MeshBasicMaterial, Object3D, Ray, Vector3, Mesh, BoxHelper } from "three";
import { AUDIO_ZONE_FLAGS } from "../inflators/audio-zone";
import { disposeMaterial, disposeNode } from "../utils/three-utils";
import { AudioSettings } from "../components/audio-params";
import { updateAudioSettings } from "../update-audio-settings";

const debugObjects = new Map<number, Object3D>();

const DEBUG_BBAA_COLOR = 0x49ef4;

let debugMaterial: MeshBasicMaterial | undefined | null;

const createMaterial = () => {
  if (!debugMaterial) {
    debugMaterial = new MeshBasicMaterial({
      color: DEBUG_BBAA_COLOR,
      transparent: true,
      opacity: 0.25,
      side: DoubleSide
    });
  }
};

getScene().then(() => {
  (APP.store as any).addEventListener("statechanged", () => {
    const isDebugEnabled = APP.store.state.preferences.showAudioDebugPanel;
    if (isDebugEnabled) createMaterial();
    defineQuery([AudioZone])(APP.world).forEach(zoneEid => {
      if (isDebugEnabled) {
        !debugObjects.has(zoneEid) && addZoneDebugObject(APP.world, zoneEid);
      } else {
        debugObjects.has(zoneEid) && releaseZoneDebugObject(APP.world, zoneEid);
      }
    });
    if (!isDebugEnabled && debugMaterial) {
      disposeMaterial(debugMaterial);
      debugMaterial = null;
    }
  });
  const isDebugEnabled = APP.store.state.preferences.showAudioDebugPanel;
  if (isDebugEnabled) createMaterial();
});

const addZoneDebugObject = (world: HubsWorld, zoneEid: number) => {
  const geometry = new BoxGeometry();
  const mesh = new Mesh(geometry, debugMaterial!);
  const helper = new BoxHelper(mesh, DEBUG_BBAA_COLOR);

  const parent = world.eid2obj.get(zoneEid) as Object3D;
  parent.add(helper);
  parent.updateMatrixWorld(true);

  debugObjects.set(zoneEid, helper);
};

const releaseZoneDebugObject = (world: HubsWorld, zoneEid: number) => {
  const helper = debugObjects.get(zoneEid)!;
  helper?.removeFromParent();
  disposeNode(helper);
  debugObjects.delete(zoneEid);
};

const isZoneEnabled = (zoneEid: number): boolean => {
  return Boolean(AudioZone.flags[zoneEid] & AUDIO_ZONE_FLAGS.ENABLED);
};

const getZoneBoundingBox = (zoneEid: number) => {
  if (AudioZone.flags[zoneEid] & AUDIO_ZONE_FLAGS.DYNAMIC) {
    const obj = APP.world.eid2obj.get(zoneEid)!;
    return aabbs.get(zoneEid)!.setFromObject(obj);
  } else {
    return aabbs.get(zoneEid)!;
  }
};

const zoneContains = (zoneEid: number, position: Vector3) => {
  return getZoneBoundingBox(zoneEid).containsPoint(position);
};

const getEmitterParams = (zoneEid: number): Partial<AudioSettings> | undefined => {
  return APP.audioOverrides.get(zoneEid);
};

type AnyPredicate = (zoneEid: number) => boolean;
const any = (set: Set<number>, predicate: AnyPredicate) => {
  for (const item of set) {
    if (predicate(item)) return true;
  }
  return false;
};

const isUpdated = (currZones: Set<number>, prevZones: Set<Number>) => {
  return (
    currZones && prevZones && (currZones.size !== prevZones.size || any(currZones, zoneEid => !prevZones.has(zoneEid)))
  );
};

const getEmitterPosition = (() => {
  const pos = new Vector3();
  return (emitterEid: number) => {
    const audio = APP.audios.get(emitterEid);
    if (audio) {
      audio.getWorldPosition(pos);
    } else {
      pos.set(0, 0, 0);
    }
    return pos;
  };
})();

const applyEmitterParams = (emitterEid: number, params: Partial<AudioSettings>) => {
  APP.zoneOverrides.set(emitterEid, params);
  const audio = APP.audios.get(emitterEid);
  updateAudioSettings(emitterEid, audio);
};

const restoreEmitterParams = (emitterEid: number) => {
  APP.zoneOverrides.delete(emitterEid);
  const audio = APP.audios.get(emitterEid);
  updateAudioSettings(emitterEid, audio);
};

const setRay = (() => {
  const direction = new Vector3();
  return (ray: Ray, from: Vector3, to: Vector3) => {
    ray.set(from, direction.subVectors(to, from).normalize());
  };
})();

const exclude = (zones: Set<number>) => {
  return (zoneEid: number) => {
    return !zones.has(zoneEid);
  };
};

const hasIntersection = (ray: Ray) => {
  const intersectTarget = new Vector3();
  return (zoneEid: number) => {
    ray.intersectBox(getZoneBoundingBox(zoneEid), intersectTarget);
    return intersectTarget !== null;
  };
};

const updateEmitter = (() => {
  const ray = new Ray();
  return (
    emitterEid: number,
    emitterPosition: Vector3,
    emitterZones: Set<number>,
    listenerPosition: Vector3,
    listenerZones: Set<number>
  ) => {
    setRay(ray, listenerPosition, emitterPosition);

    // TODO: Reimplement the desired sorting of zones
    const inOutParams = Array.from(emitterZones)
      .filter(zoneEid => AudioZone.flags[zoneEid] & AUDIO_ZONE_FLAGS.IN_OUT)
      .filter(exclude(listenerZones))
      .filter(hasIntersection(ray))
      .map(zone => getEmitterParams(zone))
      .reduce(paramsReducer, null);

    // TODO: Reimplement the desired sorting of zones
    const outInParams = Array.from(listenerZones)
      .filter(zoneEid => AudioZone.flags[zoneEid] & AUDIO_ZONE_FLAGS.OUT_IN)
      .filter(exclude(emitterZones))
      .filter(hasIntersection(ray))
      .map(zone => getEmitterParams(zone))
      .reduce(paramsReducer, null);

    if (!outInParams && !inOutParams) {
      restoreEmitterParams(emitterEid);
    } else if (outInParams && !inOutParams) {
      applyEmitterParams(emitterEid, outInParams);
    } else if (!outInParams && inOutParams) {
      applyEmitterParams(emitterEid, inOutParams);
    } else {
      // In this case two zones ar acting over the same emitter simultaneously.
      // We apply the closest zone params with the lowest gain
      applyEmitterParams(
        emitterEid,
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
type ReducedAudioSettings = Pick<Partial<AudioSettings>, ReducedAudioSettingsKeys>;

// We apply the most restrictive audio parameters
const paramsReducer = (acc: Partial<AudioSettings>, curr: Partial<AudioSettings>): Partial<AudioSettings> => {
  if (!curr && !acc) return {} as AudioSettings;
  else if (curr && !acc) return curr;
  else if (!curr && acc) return acc;
  else
    return REDUCED_KEYS.reduce(
      (result: ReducedAudioSettings, key: ReducedAudioSettingsKeys): Partial<AudioSettings> => {
        if (curr[key] !== undefined && acc[key] !== undefined) {
          result[key] = Math.min(acc[key]!, curr[key]!);
        } else if (curr[key] !== undefined && acc[key] === undefined) {
          result[key] = curr[key];
        } else if (curr[key] === undefined && acc[key] !== undefined) {
          result[key] = acc[key];
        }
        return result;
      },
      {}
    );
};

const addOrRemoveZone = (zones: Set<number>, zoneEid: number, position: Vector3) => {
  if (!zones) return;
  const isInZone = isZoneEnabled(zoneEid) && zoneContains(zoneEid, position);
  const wasInZone = zones.has(zoneEid);
  if (isInZone && !wasInZone) {
    zones.add(zoneEid);
  } else if (!isInZone && wasInZone) {
    zones.delete(zoneEid);
  }
};

const clearEntity = (entityEid: number) => {
  const zones = prevZones.get(entityEid);
  if (zones) {
    zones.clear();
    currZones.get(entityEid)?.forEach(zone => zones.add(zone));
  }
};

const currZones = new Map<number, Set<number>>();
const prevZones = new Map<number, Set<number>>();
const aabbs = new Map<number, Box3>();

const listenerPos = new Vector3();
const audioZoneQuery = defineQuery([AudioZone]);
const audioZoneEnterQuery = enterQuery(audioZoneQuery);
const audioZoneExitQuery = exitQuery(audioZoneQuery);
const audioEmitterQuery = defineQuery([AudioEmitter]);
const audioEmitterEnterQuery = enterQuery(audioEmitterQuery);
const audioEmitterExitQuery = exitQuery(audioEmitterQuery);

export function audioZoneSystem(world: HubsWorld) {
  audioEmitterEnterQuery(world).forEach(entityEid => {
    currZones.set(entityEid, new Set());
    prevZones.set(entityEid, new Set());
  });
  currZones.set(APP.audioListener.eid!, new Set());
  audioEmitterExitQuery(world).forEach(entityEid => {
    currZones.delete(entityEid);
    prevZones.delete(entityEid);
  });

  audioZoneEnterQuery(world).forEach(zoneEid => {
    const obj = APP.world.eid2obj.get(zoneEid)!;
    const aabb = new Box3();
    aabb.setFromObject(obj);
    aabbs.set(zoneEid, aabb);

    const isDebugEnabled = APP.store.state.preferences.showAudioDebugPanel;
    isDebugEnabled && !debugObjects.has(zoneEid) && addZoneDebugObject(APP.world, zoneEid);
  });
  audioZoneExitQuery(world).forEach(zoneEid => {
    aabbs.delete(zoneEid);
    debugObjects.delete(zoneEid);

    const isDebugEnabled = APP.store.state.preferences.showAudioDebugPanel;
    isDebugEnabled && debugObjects.has(zoneEid) && releaseZoneDebugObject(APP.world, zoneEid);
  });

  const zones = audioZoneQuery(world);
  if (!zones.length) return;

  const listener = APP.audioListener.eid!;
  const emitters = audioEmitterQuery(world);

  APP.audioListener.getWorldPosition(listenerPos);
  zones.forEach(zoneEid => {
    addOrRemoveZone(currZones.get(listener)!, zoneEid, listenerPos);
    emitters.forEach((emitterEid: number) => {
      addOrRemoveZone(currZones.get(emitterEid)!, zoneEid, getEmitterPosition(emitterEid));
    });
  });

  const isListenerUpdated = isUpdated(currZones.get(listener)!, prevZones.get(listener)!);
  emitters.forEach(emitterEid => {
    const isEmitterUpdated = isUpdated(currZones.get(emitterEid)!, prevZones.get(emitterEid)!);
    if (isListenerUpdated || isEmitterUpdated) {
      updateEmitter(
        emitterEid,
        getEmitterPosition(emitterEid),
        currZones.get(emitterEid)!,
        listenerPos,
        currZones.get(listener)!
      );
    }
  });

  emitters.forEach(clearEntity);
  clearEntity(APP.audioListener.eid!);
}
