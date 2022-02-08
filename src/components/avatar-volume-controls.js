import { updateAudioSettings } from "../update-audio-settings";
import { VOLUME_LABELS } from "./media-video";
const MAX_MULTIPLIER = 8;
const SMALL_STEP = 1 / (VOLUME_LABELS.length / 2);
const BIG_STEP = (MAX_MULTIPLIER - 1) / (VOLUME_LABELS.length / 2);
const DEFAULT_VOLUME_BAR_MULTIPLIER = 1.0;

AFRAME.registerComponent("avatar-volume-controls", {
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
    this.audioEl = this.el.parentEl.parentEl.querySelector("[avatar-audio-source]");
    APP.gainMultipliers.set(this.audioEl, DEFAULT_VOLUME_BAR_MULTIPLIER);
    this.updateVolumeLabel();
  },
  remove() {
    APP.gainMultipliers.delete(this.audioEl);
    window.APP.store.removeEventListener("statechanged", this.update);
  },

  changeVolumeBy(v) {
    let gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    gainMultiplier = THREE.Math.clamp(gainMultiplier + v, 0, MAX_MULTIPLIER);
    APP.gainMultipliers.set(this.audioEl, gainMultiplier);
    this.updateVolumeLabel();
    const audio = APP.audios.get(this.audioEl);
    if (audio) {
      updateAudioSettings(this.audioEl, audio);
    }
  },

  volumeUp() {
    const gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    const step = gainMultiplier > 1 - SMALL_STEP ? BIG_STEP : SMALL_STEP;
    this.changeVolumeBy(step);
  },

  volumeDown() {
    const gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    const step = gainMultiplier > 1 + SMALL_STEP ? BIG_STEP : SMALL_STEP;
    this.changeVolumeBy(-1 * step);
  },

  updateVolumeLabel() {
    const gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    const numBars = Math.min(
      VOLUME_LABELS.length - 1,
      gainMultiplier <= 1.001
        ? Math.floor(gainMultiplier / SMALL_STEP)
        : Math.floor(VOLUME_LABELS.length / 2 + (gainMultiplier - 1) / BIG_STEP)
    );
    this.volumeLabel.setAttribute("text", "value", gainMultiplier === 0 ? "Muted" : VOLUME_LABELS[numBars]);
  }
});
