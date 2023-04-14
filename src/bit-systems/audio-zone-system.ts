import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { getScene, HubsWorld } from "../app";
import { AudioZone } from "../bit-components";
import { Box3, BoxGeometry, DoubleSide, MeshBasicMaterial, Object3D, Ray, Vector3, Mesh, BoxHelper } from "three";
import { AUDIO_ZONE_FLAGS } from "../inflators/audio-zone";
import { disposeMaterial, disposeNode } from "../utils/three-utils";
import { AudioSettings } from "../components/audio-params";
import { AudioObject3D } from "./audio-emitter-system";
import { ElOrEid } from "../utils/bit-utils";
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
    obj.getWorldPosition(tmpPos);
    obj.getWorldScale(tmpScale);
    return aabbs.get(zoneEid)!.setFromCenterAndSize(tmpPos, tmpScale);
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
  return (emitterId: ElOrEid) => {
    const audio = APP.audios.get(emitterId);
    if (audio) {
      audio.getWorldPosition(pos);
    } else {
      pos.set(0, 0, 0);
    }
    return pos;
  };
})();

const applyEmitterParams = (emitterId: ElOrEid, params: Partial<AudioSettings>) => {
  APP.zoneOverrides.set(emitterId, params);
  updateAudioSettings(emitterId, APP.audios.get(emitterId));
};

const restoreEmitterParams = (emitterId: ElOrEid) => {
  APP.zoneOverrides.delete(emitterId);
  updateAudioSettings(emitterId, APP.audios.get(emitterId));
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
    emitterId: ElOrEid,
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
      restoreEmitterParams(emitterId);
    } else if (outInParams && !inOutParams) {
      applyEmitterParams(emitterId, outInParams);
    } else if (!outInParams && inOutParams) {
      applyEmitterParams(emitterId, inOutParams);
    } else {
      // In this case two zones ar acting over the same emitter simultaneously.
      // We apply the closest zone params with the lowest gain
      applyEmitterParams(
        emitterId,
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

const clearEntity = (entityId: ElOrEid) => {
  const zones = prevZones.get(entityId);
  if (zones) {
    zones.clear();
    currZones.get(entityId)?.forEach(zone => zones.add(zone));
  }
};

const currZones = new Map<ElOrEid, Set<number>>();
const prevZones = new Map<ElOrEid, Set<number>>();
const aabbs = new Map<ElOrEid, Box3>();

const listenerPos = new Vector3();
const tmpPos = new Vector3();
const tmpScale = new Vector3();
const audioZoneQuery = defineQuery([AudioZone]);
const audioZoneEnterQuery = enterQuery(audioZoneQuery);
const audioZoneExitQuery = exitQuery(audioZoneQuery);

export function audioZoneSystem(world: HubsWorld) {
  audioZoneEnterQuery(world).forEach(zoneEid => {
    const obj = APP.world.eid2obj.get(zoneEid)!;
    const aabb = new Box3();
    obj.getWorldPosition(tmpPos);
    obj.getWorldScale(tmpScale);
    aabb.setFromCenterAndSize(tmpPos, tmpScale);
    aabbs.set(zoneEid, aabb);

    const isDebugEnabled = APP.store.state.preferences.showAudioDebugPanel;
    isDebugEnabled && !debugObjects.has(zoneEid) && addZoneDebugObject(APP.world, zoneEid);
  });
  audioZoneExitQuery(world).forEach(zoneEid => {
    aabbs.delete(zoneEid);
    debugObjects.delete(zoneEid);

    APP.audios.forEach((_: AudioObject3D, emitterId: ElOrEid) => {
      restoreEmitterParams(emitterId);
      currZones.delete(emitterId);
      prevZones.delete(emitterId);
    });

    const isDebugEnabled = APP.store.state.preferences.showAudioDebugPanel;
    isDebugEnabled && debugObjects.has(zoneEid) && releaseZoneDebugObject(APP.world, zoneEid);
  });

  const zones = audioZoneQuery(world);
  if (!zones.length) return;

  const listener = APP.audioListener.eid!;

  APP.audioListener.getWorldPosition(listenerPos);
  zones.forEach(zoneEid => {
    !currZones.has(listener) && currZones.set(listener, new Set());
    !prevZones.has(listener) && prevZones.set(listener, new Set());
    addOrRemoveZone(currZones.get(listener)!, zoneEid, listenerPos);
    APP.audios.forEach((_: AudioObject3D, emitterId: ElOrEid) => {
      !currZones.has(emitterId) && currZones.set(emitterId, new Set());
      !prevZones.has(emitterId) && prevZones.set(emitterId, new Set());
      addOrRemoveZone(currZones.get(emitterId)!, zoneEid, getEmitterPosition(emitterId));
    });
  });

  const isListenerUpdated = isUpdated(currZones.get(listener)!, prevZones.get(listener)!);
  APP.audios.forEach((_: AudioObject3D, emitterId: ElOrEid) => {
    const isEmitterUpdated = isUpdated(currZones.get(emitterId)!, prevZones.get(emitterId)!);
    if (isListenerUpdated || isEmitterUpdated) {
      updateEmitter(
        emitterId,
        getEmitterPosition(emitterId),
        currZones.get(emitterId)!,
        listenerPos,
        currZones.get(listener)!
      );
    }
  });

  APP.audios.forEach((_: AudioObject3D, emitterId: ElOrEid) => clearEntity(emitterId));
  clearEntity(APP.audioListener.eid!);
}
