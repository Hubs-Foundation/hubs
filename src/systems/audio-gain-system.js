import { SourceType } from "../components/audio-params";

const CLIPPING_GAIN = 0.0001;

export class GainSystem {
  constructor() {
    this.sources = [];
    window.APP.store.addEventListener("statechanged", this.updatePrefs.bind(this));
  }

  remove() {
    this.sources = [];
    window.APP.store.removeEventListener("statechanged", this.updatePrefs);
  }

  registerSource(source) {
    this.sources.push(source);
  }

  unregisterSource(source) {
    const index = this.sources.indexOf(source);

    if (index !== -1) {
      this.sources.splice(index, 1);
    }
  }

  tick() {
    this.sources.forEach(source => {
      if (source.data.clippingEnabled) {
        const audio = source.audio();
        if (source.data.attenuation < source.data.clippingThreshold) {
          if (audio.gain.gain.value > 0 && !source.data.isClipped) {
            source.clipGain(CLIPPING_GAIN);
          }
        } else if (source.data.isClipped) {
          source.unclipGain();
        } else {
          // Update the non positional audio attenuation
          if (this.audioOutputMode === "audio") {
            this.updateSourceGain(source);
          }
        }
      } else {
        source.unclipGain();
      }
    });
  }

  updatePrefs() {
    const { enableAudioClipping, audioClippingThreshold } = window.APP.store.state.preferences;
    this.sources.forEach(source => {
      this.updateSourceGain(source);
      source.clippingUpdated({ clippingEnabled: enableAudioClipping, clippingThreshold: audioClippingThreshold });
    });
  }

  updateSourceGain(source) {
    let volume = 1.0;
    if (source.data.sourceType === SourceType.MEDIA_VIDEO) {
      volume = source.el.components["media-video"]?.data.volume;
    } else if (source.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      volume = source.el.parentEl.parentEl.querySelector("[avatar-volume-controls]").components[
        "avatar-volume-controls"
      ]?.data.volume;
    }
    source.volumeUpdated({ detail: volume });
  }
}
