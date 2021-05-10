import { SourceType } from "../components/audio-params";

const CLIPPING_GAIN = 0.0001;

AFRAME.registerSystem("audio-gain", {
  schema: {
    enabled: { default: true }
  },

  init() {
    this.sources = [];
    this.avatarRig = document.getElementById("avatar-rig");
    window.APP.store.addEventListener("statechanged", this.updatePrefs.bind(this));
  },

  remove() {
    this.sources = [];
    this.avatarRig = null;
    window.APP.store.removeEventListener("statechanged", this.updatePrefs);
  },

  registerSource(source) {
    this.sources.push(source);
  },

  unregisterSource(source) {
    const index = this.sources.indexOf(source);

    if (index !== -1) {
      this.sources.splice(index, 1);
    }
  },

  tick() {
    if (!this.data.enabled) {
      return;
    }

    this.sources.forEach(source => {
      const audio = source.audio();
      if (source.data.attenuation < source.data.clippingThreshold) {
        if (audio.gain.gain.value > 0 && !source.data.isClipped) {
          source.clipGain(CLIPPING_GAIN);
          console.log(
            `[audio-gain-system] Updating audio gain for ${source.el.id}. gain [${source.data.gain}]
            }]`
          );
        }
      } else if (source.data.isClipped) {
        source.unclipGain();
        console.log(`[audio-gain-system] Restoring audio gain for ${source.el.id}. gain [${source.data.gain}]
          }]`);
      } else {
        // Update the non positional audio attenuation
        if (this.audioOutputMode === "audio") {
          this.updateSourceGain(source);
        }
      }
    });
  },

  updatePrefs() {
    this.sources.forEach(source => {
      this.updateSourceGain(source);
    });
  },

  updateSourceGain(source) {
    let volume = 1.0;
    if (source.data.sourceType === SourceType.MEDIA_VIDEO) {
      volume = source.el.components["media-video"]?.data.volume;
    } else if (source.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      volume = source.el.parentEl.parentEl.querySelector("[avatar-volume-controls]").components[
        "avatar-volume-controls"
      ]?.data.volume;
    }
    source.sourceVolumeChanged({ detail: volume });
  }
});
