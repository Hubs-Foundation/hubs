import { addComponent, defineQuery, exitQuery, removeComponent } from "bitecs";
import { MeshStandardMaterial, Mesh, Vector3, Object3D, Quaternion } from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged, FloatyObject } from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { EntityID } from "../utils/networking-types";
import { ElOrEid, findAncestorWithComponent } from "../utils/bit-utils";
import { BodyAtRest } from "../systems/floaty-object-system";

export const Emitter2Params = (AudioEmitter as any).params as Map<number, number>;

export function isPositionalAudio(node: AudioNode): node is PannerNode {
  return node instanceof PannerNode;
}

export const getAudioPosition = (() => {
  const _position = new Vector3();
  const _quaternion = new Quaternion();
  const _scale = new Vector3();
  return (eid: ElOrEid, position: Vector3) => {
    const node = APP.audios.get(eid)!;
    if (node instanceof PannerNode) {
      const panner = node as PannerNode;
      return position.set(panner.positionX.value, panner.positionY.value, panner.positionZ.value);
    } else {
      if (typeof eid !== "number") {
        eid = eid.eid;
      }
      const obj = APP.world.eid2obj.get(eid)!;
      obj.updateMatrixWorld();
      obj.matrixWorld.decompose(_position, _quaternion, _scale);
      position.copy(_position);
    }
  };
})();

export const getAudioOrientation = (() => {
  const _position = new Vector3();
  const _quaternion = new Quaternion();
  const _scale = new Vector3();
  return (eid: ElOrEid, orientation: Vector3) => {
    const node = APP.audios.get(eid)!;
    if (node instanceof PannerNode) {
      const panner = node as PannerNode;
      return orientation.set(panner.orientationX.value, panner.orientationY.value, panner.orientationZ.value);
    } else {
      if (typeof eid !== "number") {
        eid = eid.eid;
      }
      const obj = APP.world.eid2obj.get(eid)!;
      obj.updateMatrixWorld();
      obj.matrixWorld.decompose(_position, _quaternion, _scale);
      orientation.set(0, 0, -1).applyQuaternion(_quaternion);
    }
  };
})();

export const updatePannerNode = (() => {
  const _position = new Vector3();
  const _quaternion = new Quaternion();
  const _scale = new Vector3();
  const _orientation = new Vector3();
  return (audio: PannerNode, obj: Object3D) => {
    obj.updateMatrices();
    obj.matrixWorld.decompose(_position, _quaternion, _scale);
    _orientation.set(0, 0, -1).applyQuaternion(_quaternion);
    const timeDelta = APP.world.time.delta / 1000;
    const endTime = APP.audioCtx.currentTime + timeDelta;
    audio.positionX.linearRampToValueAtTime(_position.x, endTime);
    audio.positionY.linearRampToValueAtTime(_position.y, endTime);
    audio.positionZ.linearRampToValueAtTime(_position.z, endTime);
    audio.orientationX.linearRampToValueAtTime(_orientation.x, endTime);
    audio.orientationY.linearRampToValueAtTime(_orientation.y, endTime);
    audio.orientationZ.linearRampToValueAtTime(_orientation.z, endTime);
  };
})();

export const updateAudio = (elOrEid: ElOrEid, obj: Object3D) => {
  const audio = APP.audios.get(elOrEid)!;
  const muted = !!APP.mutedState.has(elOrEid);
  const clipped = !!APP.clippingState.has(elOrEid);
  const isAudioPaused = !!APP.isAudioPaused.has(elOrEid);
  if (isPositionalAudio(audio) && !muted && !clipped && !isAudioPaused) {
    updatePannerNode(audio, obj);
  }
};

export function cleanupAudio(eid: EntityID, audioSystem: AudioSystem) {
  const audio = APP.audios.get(eid)!;
  const gain = APP.gains.get(eid)!;
  gain.disconnect();
  audio.disconnect();
  APP.audios.delete(eid);
  APP.gains.delete(eid);
  APP.supplementaryAttenuation.delete(eid);
  APP.audioOverrides.delete(eid);
  audioSystem.removeAudio({ node: audio });
  APP.audioSources.delete(eid);
}

export function swapAudioType(elOrEid: ElOrEid) {
  const { audioType } = getCurrentAudioSettings(elOrEid);
  let audio = APP.audios.get(elOrEid)!;
  const mediaElement = APP.audioSources.get(elOrEid)!;
  const gain = APP.gains.get(elOrEid)!;
  audio.disconnect();
  APP.audios.delete(elOrEid);
  if (audioType === AudioType.PannerNode) {
    audio = APP.audioCtx.createPanner();
  } else {
    audio = APP.audioCtx.createStereoPanner();
  }
  audio.connect(gain);
  APP.audios.set(elOrEid, audio);
  mediaElement.connect(audio);
}

export function makeAudioEntity(
  world: HubsWorld,
  eid: number,
  sourceType: SourceType,
  audioSystem: AudioSystem,
  overrideAudioType?: AudioType
) {
  APP.sourceType.set(eid, sourceType);

  let { audioType } = getCurrentAudioSettings(eid);
  overrideAudioType && (audioType = overrideAudioType);
  let audio;
  if (audioType === AudioType.PannerNode) {
    audio = APP.audioCtx.createPanner();
  } else {
    audio = APP.audioCtx.createStereoPanner();
  }
  const gain = APP.audioCtx.createGain();
  gain.gain.value = 0;
  audio.connect(gain);
  APP.audios.set(eid, audio);
  APP.gains.set(eid, gain);

  if (sourceType === SourceType.MEDIA_VIDEO) {
    const videoObj = world.eid2obj.get(eid) as Mesh;
    const video = (videoObj.material as MeshStandardMaterial).map!.image as HTMLVideoElement;
    if (video.paused) {
      APP.isAudioPaused.add(eid);
    } else {
      APP.isAudioPaused.delete(eid);
    }
    const audioSrcEl = video;
    const mediaElement = APP.audioCtx.createMediaElementSource(audioSrcEl);
    APP.audioSources.set(eid, mediaElement);
    mediaElement.connect(audio);
    // Original audio source volume can now be restored as audio systems will take over
    audioSrcEl.volume = 1;
    updateAudio(eid, videoObj);
  }

  addComponent(world, AudioEmitter, eid);
  audioSystem.addAudio({ sourceType, node: gain });
  updateAudioSettings(eid, audio);
}

const staleAudioEmittersQuery = defineQuery([AudioEmitter, AudioSettingsChanged]);
const audioEmitterQuery = defineQuery([AudioEmitter]);
const audioEmitterExit = exitQuery(audioEmitterQuery);
export function audioEmitterSystem(world: HubsWorld) {
  staleAudioEmittersQuery(world).forEach(function (eid) {
    let audio = APP.audios.get(eid)!;
    const settings = getCurrentAudioSettings(eid);
    if (
      (!isPositionalAudio(audio) && settings.audioType === AudioType.PannerNode) ||
      (isPositionalAudio(audio) && settings.audioType === AudioType.Stereo)
    ) {
      swapAudioType(eid);
      audio = APP.audios.get(eid)!;
      if (isPositionalAudio(audio)) {
        const obj = APP.world.eid2obj.get(eid)!;
        updatePannerNode(audio, obj);
      }
    }

    applySettings(eid, settings);
    removeComponent(world, AudioSettingsChanged, eid);
  });
  audioEmitterExit(world).forEach(eid => {
    const audioSystem = APP.scene?.systems["hubs-systems"].audioSystem;
    cleanupAudio(eid, audioSystem);
  });
  audioEmitterQuery(world).forEach(eid => {
    // For now we are only interested in updating movable media
    const isFloaty = findAncestorWithComponent(APP.world, FloatyObject, eid);
    const isAtRest = findAncestorWithComponent(APP.world, BodyAtRest, eid);
    if (isFloaty && !isAtRest) {
      const obj = APP.world.eid2obj.get(eid)!;
      updateAudio(eid, obj);
    }
  });
}
