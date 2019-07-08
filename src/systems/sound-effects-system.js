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

// Safari doesn't support the promise form of decodeAudioData, so we polyfill it.
function decodeAudioData(audioContext, arrayBuffer) {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

export class SoundEffectsSystem {
  constructor() {
    this.pendingEffects = [];
    this.audioContext = THREE.AudioContext.getContext();
    const soundsAndUrls = [
      [SOUND_HOVER_OR_GRAB, URL_TICK],
      [SOUND_THAW, URL_TICK],
      [SOUND_PEN_STOP_DRAW, URL_TICK],
      [SOUND_PEN_UNDO_DRAW, URL_TICK],
      [SOUND_PEN_CHANGE_COLOR, URL_TICK],
      [SOUND_TOGGLE_MIC, URL_TICK],
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

  tick() {
    for (let i = 0; i < this.pendingEffects.length; i++) {
      this.pendingEffects[i].start();
    }
    this.pendingEffects.length = 0;
  }
}
