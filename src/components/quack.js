import { SOUND_QUACK, SOUND_SPECIAL_QUACK } from "../systems/sound-effects-system";

AFRAME.registerComponent("quack", {
  schema: {
    quackPercentage: { default: 1 },
    specialQuackPercentage: { default: 0.01 }
  },

  init: function() {
    this._handleGrabStart = this._handleGrabStart.bind(this);
  },

  play: function() {
    this.el.object3D.addEventListener("interact", this._handleGrabStart);
  },

  pause: function() {
    this.el.object3D.removeEventListener("interact", this._handleGrabStart);
  },

  _handleGrabStart: function() {
    const rand = Math.random();
    if (rand < this.data.specialQuackPercentage) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
    } else if (rand < this.data.quackPercentage) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
    }
  }
});
