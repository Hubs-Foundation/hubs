import { updateAudioSettings } from "../update-audio-settings";
import { VOLUME_LABELS } from "./media-video";
import { findAncestorWithComponent } from "../utils/scene-graph";
import {
  calcLevel,
  calcGainStepDown,
  calcGainStepUp,
  DEFAULT_VOLUME_BAR_MULTIPLIER,
  MAX_GAIN_MULTIPLIER,
  updateAvatarVolumesPref,
  getAvatarVolumePref
} from "../utils/avatar-volume-utils";

AFRAME.registerComponent("avatar-volume-controls", {
  init() {
    this.volumeUp = this.volumeUp.bind(this);
    this.volumeDown = this.volumeDown.bind(this);
    this.volumeUpButton = this.el.querySelector(".avatar-volume-up-button");
    this.volumeDownButton = this.el.querySelector(".avatar-volume-down-button");
    this.muteButton = this.el.querySelector(".avatar-mute-button");
    this.volumeLabel = this.el.querySelector(".avatar-volume-label");
    this.volumeUpButton.object3D.addEventListener("interact", this.volumeUp);
    this.volumeDownButton.object3D.addEventListener("interact", this.volumeDown);
    this.update = this.update.bind(this);
    this.normalizer = null;
    window.APP.store.addEventListener("statechanged", this.update);
    this.audioEl = this.el.parentEl.parentEl.querySelector("[avatar-audio-source]");
    this.el.emit("gain_multiplier_updated", { gainMultiplier: DEFAULT_VOLUME_BAR_MULTIPLIER });
    this.playerInfo = findAncestorWithComponent(this.el, "player-info").components["player-info"];
    this.onRemoteMuteUpdated = this.onRemoteMuteUpdated.bind(this);
    this.playerInfo.el.addEventListener("remote_mute_updated", this.onRemoteMuteUpdated);
    this.muteButton.object3D.visible = this.playerInfo.data.muted;
    this.updateGainMultiplier(getAvatarVolumePref(this.playerInfo.displayName) || DEFAULT_VOLUME_BAR_MULTIPLIER);
    this.updateLocalMuted(this.playerInfo.data.muted);
  },
  remove() {
    APP.gainMultipliers.delete(this.audioEl);
    window.APP.store.removeEventListener("statechanged", this.update);
    this.playerInfo.el.removeEventListener("remote_mute_updated", this.onRemoteMuteUpdated);
  },

  updateGainMultiplier(gainMultiplier, updatePref = false) {
    APP.gainMultipliers.set(this.audioEl, gainMultiplier);
    const audio = APP.audios.get(this.audioEl);
    if (audio) {
      updateAudioSettings(this.audioEl, audio);
    }
    this.updateVolumeLabel();

    updatePref && updateAvatarVolumesPref(this.playerInfo.displayName, gainMultiplier);
  },

  volumeUp() {
    let gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    const step = calcGainStepUp(gainMultiplier);
    gainMultiplier = THREE.Math.clamp(gainMultiplier + step, 0, MAX_GAIN_MULTIPLIER);
    this.updateGainMultiplier(gainMultiplier, true);
    this.el.emit("gain_multiplier_updated", { gainMultiplier });
  },

  volumeDown() {
    let gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    const step = -calcGainStepDown(gainMultiplier);
    gainMultiplier = THREE.Math.clamp(gainMultiplier + step, 0, MAX_GAIN_MULTIPLIER);
    this.updateGainMultiplier(gainMultiplier, true);
    this.el.emit("gain_multiplier_updated", { gainMultiplier });
  },

  updateVolumeLabel() {
    const gainMultiplier = APP.gainMultipliers.get(this.audioEl);
    const numBars = calcLevel(gainMultiplier);
    this.volumeLabel.setAttribute(
      "text",
      "value",
      gainMultiplier === 0 || this.isLocalMuted ? "Muted" : VOLUME_LABELS[numBars]
    );
  },

  getGainMultiplier() {
    return APP.gainMultipliers.get(this.audioEl);
  },

  updateLocalMuted(muted) {
    this.isLocalMuted = muted;
    this.updateVolumeLabel();
  },

  onRemoteMuteUpdated({ detail: { muted } }) {
    this.muteButton.object3D.visible = !muted;
  }
});
