import { addComponent, defineQuery, enterQuery, exitQuery } from "bitecs";
import { Vector3, Object3D, LineSegments, WireframeGeometry, SphereBufferGeometry, PositionalAudio } from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged, AudioSource, AudioTarget } from "../bit-components";
import { SourceType } from "../components/audio-params";
import { AUDIO_SOURCE_FLAGS } from "../inflators/audio-source";
import { AudioSystem } from "../systems/audio-system";
import { Emitter2Audio, EMITTER_FLAGS, makeAudioEntity } from "./audio-emitter-system";

const createWhiteNoise = (audioContext: AudioContext, gain: number): AudioBufferSourceNode => {
  const bufferSize = 2 * audioContext.sampleRate,
    noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
    gainFilter = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    gainFilter[i] = (Math.random() * 2 - 1) * gain;
  }

  const whiteNoise = audioContext.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  whiteNoise.start(0);

  return whiteNoise;
};

const addSourceToAudioTarget = (audioSourceEid: number, source: AudioBufferSourceNode) => {
  const audioTargetEids = source2Target.get(audioSourceEid);
  audioTargetEids?.forEach(audioTargetEid => {
    const audioEid = Emitter2Audio.get(audioTargetEid)!;
    const targetAudio = APP.audios.get(audioEid)!;
    try {
      targetAudio.disconnect();
    } catch (e) {}
    if (targetAudio instanceof PositionalAudio) {
      targetAudio.panner.connect(targetAudio.gain);
    }
    targetAudio.setNodeSource(source);
    targetAudio.connect();
  });
};

const removeSourceFromAudioTarget = (audioSourceEid: number) => {
  const audioTargetEids = source2Target.get(audioSourceEid);
  audioTargetEids?.forEach(audioTargetEid => {
    const audioEid = Emitter2Audio.get(audioTargetEid)!;
    const targetAudio = APP.audios.get(audioEid)!;
    try {
      targetAudio.disconnect();
    } catch (e) {}
    if (targetAudio instanceof PositionalAudio) {
      targetAudio.panner.connect(targetAudio.gain);
    }
  });
};

const connectSourceToTarget = (audioSourceEid: number, audioTargetEid: number) => {
  let targetEids = source2Target.get(audioSourceEid);
  if (!targetEids?.includes(audioTargetEid)) {
    !targetEids && (targetEids = new Array<number>());
    targetEids.push(audioTargetEid);
    source2Target.set(audioSourceEid, targetEids);
    if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
      const whiteNoise = createWhiteNoise(APP.audioListener.context, 0.01);
      source2Noise.set(audioSourceEid, whiteNoise);
      addSourceToAudioTarget(audioSourceEid, whiteNoise);
    }
  }
};

const source2Noise = new Map<number, AudioBufferSourceNode>();
const source2Target = new Map<number, Array<number>>();
const source2Emitter = new Map<number, number>();
const source2Radius = new Map<number, number>();
const source2Debug = new Map<number, Object3D>();
const sourceWorldPos = new Vector3();
const emitterWorldPos = new Vector3();

const audioEmitterQuery = defineQuery([AudioEmitter]);
const audioEmitterExitQuery = exitQuery(audioEmitterQuery);
const audioTargetQuery = defineQuery([AudioTarget]);
const audioTargetEnterQuery = enterQuery(audioTargetQuery);
const audioTargetExitQuery = exitQuery(audioTargetQuery);
const audioSourceQuery = defineQuery([AudioSource]);
const audioSourceEnterQuery = enterQuery(audioSourceQuery);
const audioSourceExitQuery = exitQuery(audioSourceQuery);
export function audioTargetSystem(world: HubsWorld, audioSystem: AudioSystem) {
  const audioTargetEids = audioTargetQuery(world);
  const audioSourceEids = audioSourceQuery(world);
  audioEmitterExitQuery(world).forEach(audioEmitterEid => {
    const audioSourceEids = [...source2Emitter]
      .filter(([_, emitterEid]) => emitterEid === audioEmitterEid)
      .map(([audioSourceEid, _]) => audioSourceEid);
    audioSourceEids.forEach(audioSourceEid => {
      source2Emitter.delete(audioSourceEid)!;
      const whiteNoise = source2Noise.get(audioSourceEid)!;
      addSourceToAudioTarget(audioSourceEid, whiteNoise);
    });
  });
  audioTargetEnterQuery(world).forEach(audioTargetEid => {
    const ctx = APP.audioListener.context;
    const audioEid = makeAudioEntity(world, audioTargetEid, SourceType.AUDIO_TARGET, audioSystem);
    Emitter2Audio.set(audioTargetEid, audioEid);
    const audioObj = world.eid2obj.get(audioEid)!;
    const audioTarget = world.eid2obj.get(audioTargetEid)!;
    audioTarget.add(audioObj);

    const maxDelay = AudioTarget.maxDelay[audioTargetEid];
    const minDelay = AudioTarget.minDelay[audioTargetEid];
    if (maxDelay > 0) {
      const audio = APP.audios.get(audioEid)!;
      const delayNode = ctx.createDelay(maxDelay);
      delayNode.delayTime.value = THREE.MathUtils.randFloat(minDelay, maxDelay);
      audio.setFilters([delayNode]);
    }

    const audioSourceEid = AudioTarget.source[audioTargetEid];
    if (audioSourceEids.includes(audioSourceEid)) {
      connectSourceToTarget(audioSourceEid, audioTargetEid);
    }

    const audioSettings = APP.audioOverrides.get(audioTargetEid)!;
    APP.audioOverrides.set(audioEid, audioSettings);
    addComponent(world, AudioSettingsChanged, audioEid);
  });
  audioTargetExitQuery(world).forEach(audioTargetEid => {
    Emitter2Audio.delete(audioTargetEid);
    const audioSourceEid = AudioTarget.source[audioTargetEid];
    source2Target.delete(audioSourceEid);
    APP.audioOverrides.delete(audioTargetEid);
  });
  audioSourceEnterQuery(world).forEach(audioSourceEid => {
    const audioTargetEid = audioTargetEids.find(
      audioTargetEid => AudioTarget.source[audioTargetEid] === audioSourceEid
    );
    audioTargetEid && connectSourceToTarget(audioSourceEid, audioTargetEid);

    const obj = APP.world.eid2obj.get(audioSourceEid)!;
    if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
      const debugObj = new LineSegments(new WireframeGeometry(new SphereBufferGeometry(1, 10, 10)));
      source2Debug.set(audioSourceEid, debugObj);
      obj.add(debugObj);
    }

    // TODO this should probably be using bounds similar to media-frames and trigger-volume.
    // Doing the simple thing for now since we only support avatar audio sources currently
    obj.updateMatrixWorld();
    const radius = obj.matrixWorld.getMaxScaleOnAxis();
    source2Radius.set(audioSourceEid, radius * radius);
  });
  audioSourceExitQuery(world).forEach(audioSourceEid => {
    removeSourceFromAudioTarget(audioSourceEid);
    source2Target.delete(audioSourceEid);
    const noise = source2Noise.get(audioSourceEid);
    noise?.disconnect();
    source2Noise.delete(audioSourceEid);
    source2Radius.delete(audioSourceEid);
    source2Emitter.delete(audioSourceEid);
    if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
      const debugObj = source2Debug.get(audioSourceEid)!;
      debugObj.removeFromParent();
      source2Debug.delete(audioSourceEid);
    }
  });
  audioSourceEids.forEach(audioSourceEid => {
    const obj = APP.world.eid2obj.get(audioSourceEid)!;
    obj.updateMatrixWorld();
    obj.getWorldPosition(sourceWorldPos);
    const radius = source2Radius.get(audioSourceEid)!;
    const currentEmitterEid = source2Emitter.get(audioSourceEid)!;
    if (currentEmitterEid) {
      const currentEmitterAudio = APP.audios.get(currentEmitterEid)!;
      currentEmitterAudio.getWorldPosition(emitterWorldPos);
      const distanceSquared = emitterWorldPos.distanceToSquared(sourceWorldPos);
      if (distanceSquared > radius) {
        source2Emitter.delete(audioSourceEid);
        if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
          const whiteNoise = source2Noise.get(audioSourceEid)!;
          addSourceToAudioTarget(audioSourceEid, whiteNoise);
        }
        AudioEmitter.flags[currentEmitterEid] &= ~EMITTER_FLAGS.MUTED;
        addComponent(world, AudioSettingsChanged, currentEmitterEid);
      }
    } else {
      audioEmitterQuery(world).every(audioEmitterEid => {
        const sourceType = APP.sourceType.get(audioEmitterEid);
        if (sourceType === SourceType.AUDIO_TARGET) return true;
        if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
          // TODO Check user permissions
        }
        const emitterAudio = APP.audios.get(audioEmitterEid)!;
        emitterAudio.getWorldPosition(emitterWorldPos);
        const distanceSquared = emitterWorldPos.distanceToSquared(sourceWorldPos);
        if (distanceSquared < radius) {
          source2Emitter.set(audioSourceEid, audioEmitterEid);
          if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.MUTE_SELF) {
            AudioEmitter.flags[audioEmitterEid] |= EMITTER_FLAGS.MUTED;
            addComponent(world, AudioSettingsChanged, audioEmitterEid);
          }
          emitterAudio.source && addSourceToAudioTarget(audioSourceEid, emitterAudio.source);
          return false;
        }
        return true;
      });
    }
  });
}
