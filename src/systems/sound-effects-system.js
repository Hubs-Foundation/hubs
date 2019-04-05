/* global fetch THREE */
import URL_TICK from "../assets/sfx/tick.mp3";
import URL_TELEPORT_ARC from "../assets/sfx/teleportArc.mp3";
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
export const SOUND_PEN_CHANGE_RADIUS = soundEnum++;
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

export class SoundEffectsSystem {
  constructor() {
    this.pendingEffects = [];
    this.audioContext = THREE.AudioContext.getContext();
    const soundsAndUrls = [
      [SOUND_HOVER_OR_GRAB, URL_TICK],
      [SOUND_THAW, URL_TICK],
      [SOUND_PEN_STOP_DRAW, URL_TICK],
      [SOUND_PEN_UNDO_DRAW, URL_TICK],
      [SOUND_PEN_CHANGE_RADIUS, URL_TICK],
      [SOUND_PEN_CHANGE_COLOR, URL_TICK],
      [SOUND_TOGGLE_MIC, URL_TICK],
      [
        SOUND_TELEPORT_START,
        "https://hubs-proxy.com/https://r3---sn-pouxbg5-naje.googlevideo.com/videoplayback?signature=B4CB9C5FEE880031B74BBCBCFBA99FB601D775A8.D4D08161F63F0822F7329B203523816B282FF9C9&ipbits=0&itag=251&pcm2cms=yes&keepalive=yes&dur=220.981&mime=audio%2Fwebm&fvip=2&mv=m&pl=24&mt=1554432609&ms=au%2Crdu&id=o-AHsxsnh8BgHqzXxNk1aOn852naBEHAjn_THRD2NUgRTK&ei=2cKmXPyDMIOFkgb2kKLoDw&mn=sn-pouxbg5-naje%2Csn-n4v7knls&source=youtube&mm=31%2C29&gir=yes&expire=1554454329&ip=63.245.221.200&lmt=1539937917807763&requiressl=yes&clen=4065803&sparams=clen%2Cdur%2Cei%2Cgir%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Ckeepalive%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpcm2cms%2Cpl%2Crequiressl%2Csource%2Cexpire&txp=5511222&c=WEB&initcwndbps=4996250&key=yt6&ratebypass=yes"
      ],
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
    const loadedUrls = new Set();
    const audioBuffers = new Map();
    const load = url => {
      if (loadedUrls.has(url)) {
        return null;
      }
      loadedUrls.add(url);
      return fetch(url)
        .then(r => r.arrayBuffer())
        .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => audioBuffers.set(url, audioBuffer));
    };
    Promise.all(soundsAndUrls.map(([, url]) => load(url))).then(() => {
      this.sounds = new Map(soundsAndUrls.map(([sound, url]) => [sound, audioBuffers.get(url)]));
    });
  }

  enqueueSound(sound, loop) {
    if (!this.sounds) return null;
    // The nodes are very inexpensive to create, according to
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds.get(sound);
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

  playOngoingSound(sound) {
    if (!this.sounds) return null;
    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    source.buffer = this.sounds.get(sound);
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
    if (!this.sounds) return;

    for (let i = 0; i < this.pendingEffects.length; i++) {
      this.pendingEffects[i].start();
    }
    this.pendingEffects.length = 0;
  }
}
