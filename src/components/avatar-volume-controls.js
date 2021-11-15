import { VOLUME_LABELS } from "./media-views";
const MAX_VOLUME = 8;
const SMALL_STEP = 1 / (VOLUME_LABELS.length / 2);
const BIG_STEP = (MAX_VOLUME - 1) / (VOLUME_LABELS.length / 2);

// Inserts analyser and gain nodes after audio source.
// Analyses audio source volume and adjusts gain value
// to make it in a certain range.
class AudioNormalizer {
  constructor(audio) {
    this.audio = audio;
    this.analyser = audio.context.createAnalyser();
    this.connected = false;

    // To analyse volume, 32 fftsize may be good enough
    this.analyser.fftSize = 32;
    this.gain = audio.context.createGain();
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    this.volumes = [];
    this.volumeSum = 0;
  }

  apply() {
    if (window.APP.store.state.preferences.audioNormalization) {
      if (!this.connected) {
        this.connect();
      }
    } else {
      if (this.connected) {
        this.disconnect();
      }
      return;
    }

    // Adjusts volume in "a rule of the thumb" way
    // Any better algorithm?

    // Regards the RMS of time-domain data as volume.
    // Is this a right approach?
    // Using the RMS of frequency-domain data would be another option.
    this.analyser.getByteTimeDomainData(this.timeData);
    const squareSum = this.timeData.reduce((sum, num) => sum + Math.pow(num - 128, 2), 0);
    const volume = Math.sqrt(squareSum / this.analyser.frequencyBinCount);
    const baseVolume = window.APP.store.state.preferences.audioNormalization;

    // Regards volume under certain threshold as "not speaking" and skips.
    // I'm not sure if 0.4 is an appropriate threshold.
    if (volume >= Math.min(0.4, baseVolume)) {
      this.volumeSum += volume;
      this.volumes.push(volume);
      // Sees only recent volume history because there is a chance
      // that a speaker changes their master input volume.
      // I'm not sure if 600 is an appropriate number.
      while (this.volumes.length > 600) {
        this.volumeSum -= this.volumes.shift();
      }
      // Adjusts volume after getting many enough volume history.
      // I'm not sure if 60 is an appropriate number.
      if (this.volumes.length >= 60) {
        const averageVolume = this.volumeSum / this.volumes.length;
        this.gain.gain.setTargetAtTime(baseVolume / averageVolume, this.audio.context.currentTime, 0.01);
      }
    }
  }

  connect() {
    // Hacks. THREE.Audio connects audio nodes when source is set.
    // If audio is not played yet, THREE.Audio.setFilters() doesn't
    // reset connections. Then manually caling .connect()/disconnect() here.
    // This might be a bug of Three.js and should be fixed in Three.js side?
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.disconnect();
    }
    const filters = this.audio.getFilters();
    filters.unshift(this.analyser, this.gain);
    this.audio.setFilters(filters);
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.connect();
    }
    this.connected = true;
  }

  disconnect() {
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.disconnect();
    }
    const filters = [this.analyser, this.gain];
    this.audio.setFilters(this.audio.getFilters().filter(filter => !filters.includes(filter)));
    if (this.audio.source && !this.audio.isPlaying) {
      this.audio.connect();
    }
    this.connected = false;
  }
}

AFRAME.registerComponent("avatar-volume-controls", {
  schema: {
    volume: { type: "number", default: 1.0 }
  },

  init() {
    this.volumeUp = this.volumeUp.bind(this);
    this.volumeDown = this.volumeDown.bind(this);
    this.changeVolumeBy = this.changeVolumeBy.bind(this);
    this.volumeUpButton = this.el.querySelector(".avatar-volume-up-button");
    this.volumeDownButton = this.el.querySelector(".avatar-volume-down-button");
    this.volumeLabel = this.el.querySelector(".avatar-volume-label");
    this.volumeUpButton.object3D.addEventListener("interact", this.volumeUp);
    this.volumeDownButton.object3D.addEventListener("interact", this.volumeDown);
    this.update = this.update.bind(this);
    this.normalizer = null;
    window.APP.store.addEventListener("statechanged", this.update);

    this.updateVolumeLabel();
  },
  remove() {
    window.APP.store.removeEventListener("statechanged", this.update);
  },

  changeVolumeBy(v) {
    this.el.setAttribute("avatar-volume-controls", "volume", THREE.Math.clamp(this.data.volume + v, 0, MAX_VOLUME));
    this.updateVolumeLabel();
  },

  volumeUp() {
    const step = this.data.volume > 1 - SMALL_STEP ? BIG_STEP : SMALL_STEP;
    this.changeVolumeBy(step);
  },

  volumeDown() {
    const step = this.data.volume > 1 + SMALL_STEP ? BIG_STEP : SMALL_STEP;
    this.changeVolumeBy(-1 * step);
  },

  update: (function() {
    const positionA = new THREE.Vector3();
    const positionB = new THREE.Vector3();
    return function update() {
      const audio = this.avatarAudioSource && this.avatarAudioSource.el.getObject3D(this.avatarAudioSource.attrName);
      if (!audio) {
        return;
      }

      if (!this.normalizer) {
        this.normalizer = new AudioNormalizer(audio);
        this.avatarAudioSource.el.addEventListener("sound-source-set", () => {
          const audio =
            this.avatarAudioSource && this.avatarAudioSource.el.getObject3D(this.avatarAudioSource.attrName);
          if (audio) {
            this.normalizer = new AudioNormalizer(audio);
            this.normalizer.apply();
          }
        });
      }

      this.normalizer.apply();

      const { audioOutputMode, globalVoiceVolume } = window.APP.store.state.preferences;
      const volumeModifier = (globalVoiceVolume !== undefined ? globalVoiceVolume : 100) / 100;
      let gain = volumeModifier * this.data.volume;
      if (audioOutputMode === "audio") {
        this.avatarAudioSource.el.object3D.getWorldPosition(positionA);
        this.el.sceneEl.audioListener.getWorldPosition(positionB);
        const squaredDistance = positionA.distanceToSquared(positionB);
        gain = gain * Math.min(1, 10 / Math.max(1, squaredDistance));
      }

      audio.gain.gain.value = gain;
    };
  })(),

  updateVolumeLabel() {
    const numBars = Math.min(
      VOLUME_LABELS.length - 1,
      this.data.volume <= 1.001
        ? Math.floor(this.data.volume / SMALL_STEP)
        : Math.floor(VOLUME_LABELS.length / 2 + (this.data.volume - 1) / BIG_STEP)
    );
    this.volumeLabel.setAttribute("text", "value", this.data.volume === 0 ? "Muted" : VOLUME_LABELS[numBars]);
  },

  tick() {
    if (!this.avatarAudioSource && !this.searchFailed) {
      // Walk up to Spine and then search down.
      const sourceEl = this.el.parentNode.parentNode.querySelector("[avatar-audio-source]");
      if (!sourceEl || !sourceEl.components["avatar-audio-source"]) {
        this.searchFailed = true;
        return;
      }
      this.avatarAudioSource = sourceEl.components["avatar-audio-source"];
    }

    this.update();
  }
});
