import { AComponent, AElement } from "aframe";
import { addComponent, defineQuery, enterQuery, exitQuery } from "bitecs";
import { Vector3, Object3D, LineSegments, WireframeGeometry, SphereBufferGeometry, PositionalAudio } from "three";
import { HubsWorld } from "../app";
import { AudioSettingsChanged, AudioSource, AudioTarget } from "../bit-components";
import { SourceType } from "../components/audio-params";
import { getMediaStream } from "../components/avatar-audio-source";
import { AUDIO_SOURCE_FLAGS } from "../inflators/audio-source";
import { AudioSystem } from "../systems/audio-system";
import { Emitter2Audio, makeAudioEntity } from "./audio-emitter-system";

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

const addSourceToAudioTarget = (audioSourceEid: number, source: AudioNode) => {
  const audioTargetEids = source2Target.get(audioSourceEid);
  audioTargetEids?.forEach(audioTargetEid => {
    const audioEid = Emitter2Audio.get(audioTargetEid)!;
    const targetAudio = APP.audios.get(audioEid)!;
    try {
      // The WebAudio API doesn't support checking if an audio node is already connected so we always disconnect it but don't log as it's an expected behavior and the error is not meaningful.
      targetAudio.disconnect();
    } catch (e) {}
    if (targetAudio instanceof PositionalAudio) {
      targetAudio.panner.connect(targetAudio.gain);
    }
    targetAudio.setNodeSource(source as AudioBufferSourceNode);
    targetAudio.connect();
  });
};

const removeSourceFromAudioTarget = (audioSourceEid: number) => {
  const audioTargetEids = source2Target.get(audioSourceEid);
  audioTargetEids?.forEach(audioTargetEid => {
    const audioEid = Emitter2Audio.get(audioTargetEid)!;
    const targetAudio = APP.audios.get(audioEid)!;
    try {
      // The WebAudio API doesn't support checking if an audio node is already connected so we always disconnect it but don't log as it's an expected behavior and the error is not meaningful.
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
const source2Emitter = new Map<number, AElement>();
const source2Radius = new Map<number, number>();
const source2Debug = new Map<number, Object3D>();
const sourceWorldPos = new Vector3();

const audioTargetQuery = defineQuery([AudioTarget]);
const audioTargetEnterQuery = enterQuery(audioTargetQuery);
const audioTargetExitQuery = exitQuery(audioTargetQuery);
const audioSourceQuery = defineQuery([AudioSource]);
const audioSourceEnterQuery = enterQuery(audioSourceQuery);
const audioSourceExitQuery = exitQuery(audioSourceQuery);
export function audioTargetSystem(world: HubsWorld, audioSystem: AudioSystem) {
  const audioTargetEids = audioTargetQuery(world);
  const audioSourceEids = audioSourceQuery(world);
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

    // TODO this should probably be using bounds similar to media-frames and trigger-volume.
    // Doing the simple thing for now since we only support avatar audio sources currently
    const obj = APP.world.eid2obj.get(audioSourceEid)!;
    obj.updateMatrixWorld();
    const radius = obj.matrixWorld.getMaxScaleOnAxis();
    source2Radius.set(audioSourceEid, radius * radius);

    if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
      const debugObj = new LineSegments(new WireframeGeometry(new SphereBufferGeometry(radius, 10, 10)));
      source2Debug.set(audioSourceEid, debugObj);
      obj.add(debugObj);
    }
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
    const playerInfos = APP.componentRegistry["player-info"];
    if (source2Emitter.has(audioSourceEid)) {
      const emitterId = source2Emitter.get(audioSourceEid)!;
      const playerInfoExists = playerInfos.find((playerInfo: AComponent) => playerInfo.el === emitterId);
      if (playerInfoExists) {
        const sourceObj = world.eid2obj.get(audioSourceEid)!;
        sourceObj.getWorldPosition(sourceWorldPos);
        const distanceSquared = emitterId.object3D.position.distanceToSquared(sourceWorldPos);
        const radius = source2Radius.get(audioSourceEid)!;
        if (distanceSquared > radius) {
          source2Emitter.delete(audioSourceEid);
          if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
            const whiteNoise = source2Noise.get(audioSourceEid)!;
            addSourceToAudioTarget(audioSourceEid, whiteNoise);
          }
        }
      } else {
        source2Emitter.delete(audioSourceEid);
        if (AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.DEBUG) {
          const whiteNoise = source2Noise.get(audioSourceEid)!;
          addSourceToAudioTarget(audioSourceEid, whiteNoise);
        }
      }
    } else {
      for (let i = 0; i < playerInfos.length; i++) {
        const playerInfo = playerInfos[i];
        const avatar = playerInfo.el;

        if (
          AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.ONLY_MODS &&
          !(playerInfo as any).can("amplify_audio")
        )
          continue;

        // don't use avatar-rig if not entering scene yet.
        if (avatar.id === "avatar-rig" && !APP.scene!.is("entered")) continue;

        const sourceObj = world.eid2obj.get(audioSourceEid)!;
        sourceObj.getWorldPosition(sourceWorldPos);
        const distanceSquared = avatar.object3D.position.distanceToSquared(sourceWorldPos);
        const radius = source2Radius.get(audioSourceEid)!;
        if (distanceSquared < radius) {
          source2Emitter.set(audioSourceEid, avatar);
          const muteSelf = AudioSource.flags[audioSourceEid] & AUDIO_SOURCE_FLAGS.MUTE_SELF;
          const isOwnAvatar = avatar.id === "avatar-rig";
          if (muteSelf && isOwnAvatar) {
            removeSourceFromAudioTarget(audioSourceEid);
          } else {
            getMediaStream(avatar).then(stream => {
              const audioListener = APP.audioListener;
              const ctx = audioListener.context;
              const node = ctx.createMediaStreamSource(stream);
              addSourceToAudioTarget(audioSourceEid, node);
            });
          }
        }
      }
    }
  });
}
