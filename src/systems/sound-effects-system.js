/* global fetch THREE */
import URL_TICK from "../assets/sfx/tick.mp3";
import URL_TELEPORT_LOOP from "../assets/sfx/teleport-loop.mp3";
import URL_QUICK_TURN from "../assets/sfx/quickTurn.mp3";
import URL_TAP_MELLOW from "../assets/sfx/tap_mellow.mp3";
import URL_PEN_SPAWN from "../assets/sfx/PenSpawn.mp3";
import URL_PEN_DRAW from "../assets/sfx/PenDraw1.mp3";
import URL_CAMERA_SNAPSHOT from "../assets/sfx/PicSnapHey.mp3";
import URL_WELCOME from "../assets/sfx/welcome.mp3";
import URL_QUACK from "../assets/sfx/quack.mp3";
import URL_SPECIAL_QUACK from "../assets/sfx/specialquack.mp3";
import URL_POP from "../assets/sfx/pop.mp3";
import URL_FREEZE from "../assets/sfx/Eb_blip.mp3";
import URL_TACK from "../assets/sfx/tack.mp3";
import URL_MEDIA_LOADED from "../assets/sfx/A_bendUp.mp3";
import URL_MEDIA_LOADING from "../assets/sfx/suspense.mp3";
import { setMatrixWorld } from "../utils/three-utils";

let soundEnum = 0;
export const SOUND_HOVER_OR_GRAB = soundEnum++;
export const SOUND_THAW = soundEnum++;
export const SOUND_PEN_STOP_DRAW = soundEnum++;
export const SOUND_PEN_UNDO_DRAW = soundEnum++;
export const SOUND_PEN_CHANGE_COLOR = soundEnum++;
export const SOUND_TOGGLE_MIC = soundEnum++;
export const SOUND_TELEPORT_START = soundEnum++;
export const SOUND_TELEPORT_END = soundEnum++;
export const SOUND_SNAP_ROTATE = soundEnum++;
export const SOUND_SPAWN_PEN = soundEnum++;
export const SOUND_PEN_START_DRAW = soundEnum++;
export const SOUND_CAMERA_TOOL_TOOK_SNAPSHOT = soundEnum++;
export const SOUND_ENTER_SCENE = soundEnum++;
export const SOUND_QUACK = soundEnum++;
export const SOUND_SPECIAL_QUACK = soundEnum++;
export const SOUND_CHAT_MESSAGE = soundEnum++;
export const SOUND_FREEZE = soundEnum++;
export const SOUND_PIN = soundEnum++;
export const SOUND_MEDIA_LOADING = soundEnum++;
export const SOUND_MEDIA_LOADED = soundEnum++;
export const SOUND_CAMERA_TOOL_COUNTDOWN = soundEnum++;

// Safari doesn't support the promise form of decodeAudioData, so we polyfill it.
function decodeAudioData(audioContext, arrayBuffer) {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

function isFinishedPlaying(positionalAudio) {
  return !positionalAudio.isPlaying && !positionalAudio.source.loop;
}

export class SoundEffectsSystem {
  constructor(scene) {
    this.pendingEffects = [];
    this.positionalAudiosStationary = [];
    this.positionalAudiosFollowingObject3Ds = [];

    this.audioContext = THREE.AudioContext.getContext();
    this.scene = scene;
    this.scene.audioListener = this.scene.audioListener || new THREE.AudioListener();
    if (this.scene.camera) {
      this.scene.camera.add(this.scene.audioListener);
    }
    this.scene.addEventListener("camera-set-active", evt => {
      evt.detail.cameraEl.getObject3D("camera").add(this.scene.audioListener);
    });
    const soundsAndUrls = [
      [SOUND_HOVER_OR_GRAB, URL_TICK],
      [SOUND_THAW, URL_TICK],
      [SOUND_PEN_STOP_DRAW, URL_TICK],
      [SOUND_PEN_UNDO_DRAW, URL_TICK],
      [SOUND_PEN_CHANGE_COLOR, URL_TICK],
      [SOUND_TOGGLE_MIC, URL_TICK],
      [SOUND_CAMERA_TOOL_COUNTDOWN, URL_TICK],
      [SOUND_TELEPORT_START, URL_TELEPORT_LOOP],
      [SOUND_TELEPORT_END, URL_QUICK_TURN],
      [SOUND_SNAP_ROTATE, URL_TAP_MELLOW],
      [SOUND_SPAWN_PEN, URL_PEN_SPAWN],
      [SOUND_PEN_START_DRAW, URL_PEN_DRAW],
      [SOUND_CAMERA_TOOL_TOOK_SNAPSHOT, URL_CAMERA_SNAPSHOT],
      [SOUND_ENTER_SCENE, URL_WELCOME],
      [SOUND_QUACK, URL_QUACK],
      [SOUND_SPECIAL_QUACK, URL_SPECIAL_QUACK],
      [SOUND_CHAT_MESSAGE, URL_POP],
      [SOUND_FREEZE, URL_FREEZE],
      [SOUND_PIN, URL_TACK],
      [SOUND_MEDIA_LOADING, URL_MEDIA_LOADING],
      [SOUND_MEDIA_LOADED, URL_MEDIA_LOADED]
    ];
    const loading = new Map();
    const load = url => {
      let audioBufferPromise = loading.get(url);
      if (!audioBufferPromise) {
        audioBufferPromise = fetch(url)
          .then(r => r.arrayBuffer())
          .then(arrayBuffer => decodeAudioData(this.audioContext, arrayBuffer));
        loading.set(url, audioBufferPromise);
      }
      return audioBufferPromise;
    };
    this.sounds = new Map();
    soundsAndUrls.map(([sound, url]) => {
      load(url).then(audioBuffer => {
        this.sounds.set(sound, audioBuffer);
      });
    });
  }

  enqueueSound(sound, loop) {
    const audioBuffer = this.sounds.get(sound);
    if (!audioBuffer) return null;
    // The nodes are very inexpensive to create, according to
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.loop = loop;
    this.pendingEffects.push(source);
    return source;
  }

  enqueuePositionalSound(sound, loop) {
    const audioBuffer = this.sounds.get(sound);
    if (!audioBuffer) return null;

    const positionalAudio = new THREE.PositionalAudio(this.scene.audioListener);
    const source = this.scene.audioListener.context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = loop || false;
    positionalAudio.setNodeSource(source);
    this.scene.object3D.add(positionalAudio);
    this.pendingEffects.push(source);
    return positionalAudio;
  }

  playPositionalSoundAt(sound, position, loop) {
    const positionalAudio = this.enqueuePositionalSound(sound, loop);
    if (!positionalAudio) return null;
    positionalAudio.position.copy(position);
    positionalAudio.matrixWorldNeedsUpdate = true;
    this.positionalAudiosStationary.push(positionalAudio);
  }

  playPositionalSoundFollowing(sound, object3D, loop) {
    const positionalAudio = this.enqueuePositionalSound(sound, loop);
    if (!positionalAudio) return null;
    this.positionalAudiosFollowingObject3Ds.push({ positionalAudio, object3D });
    return positionalAudio;
  }

  playSoundOneShot(sound) {
    return this.enqueueSound(sound, false);
  }

  playSoundLooped(sound) {
    return this.enqueueSound(sound, true);
  }

  playSoundLoopedWithGain(sound) {
    const audioBuffer = this.sounds.get(sound);
    if (!audioBuffer) return null;

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    source.buffer = audioBuffer;
    source.connect(gain);
    gain.connect(this.audioContext.destination);
    source.loop = true;
    this.pendingEffects.push(source);
    return { gain, source };
  }

  stopSoundNode(node) {
    const index = this.pendingEffects.indexOf(node);
    if (index !== -1) {
      this.pendingEffects.splice(index, 1);
    } else {
      node.stop();
    }
  }

  stopPositionalAudio(inPositionalAudio) {
    const pendingIndex = this.pendingEffects.indexOf(inPositionalAudio.source);
    if (pendingIndex !== -1) {
      this.pendingEffects.splice(pendingIndex, 1);
    }
    inPositionalAudio.disconnect();
    inPositionalAudio.parent.remove(inPositionalAudio);
    this.positionalAudiosStationary = this.positionalAudiosStationary.filter(
      positionalAudio => positionalAudio !== inPositionalAudio
    );
    this.positionalAudiosFollowingObject3Ds = this.positionalAudiosFollowingObject3Ds.filter(
      ({ positionalAudio }) => positionalAudio !== inPositionalAudio
    );
  }

  tick() {
    for (let i = 0; i < this.pendingEffects.length; i++) {
      this.pendingEffects[i].start();
    }
    this.pendingEffects.length = 0;

    for (let i = this.positionalAudiosStationary.length - 1; i >= 0; i--) {
      const positionalAudio = this.positionalAudiosStationary[i];
      if (isFinishedPlaying(positionalAudio)) {
        positionalAudio.disconnect();
        positionalAudio.parent.remove(positionalAudio);
        this.positionalAudiosStationary.splice(i, 1);
      }
    }

    for (let i = this.positionalAudiosFollowingObject3Ds.length - 1; i >= 0; i--) {
      const { positionalAudio, object3D } = this.positionalAudiosFollowingObject3Ds[i];
      if (isFinishedPlaying(positionalAudio) || !object3D.parent) {
        positionalAudio.disconnect();
        positionalAudio.parent.remove(positionalAudio);
        this.positionalAudiosFollowingObject3Ds.splice(i, 1);
      } else {
        object3D.updateMatrices();
        setMatrixWorld(positionalAudio, object3D.matrixWorld);
      }
    }
  }
}
