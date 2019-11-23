/* global performance */

import { SOUND_SPAWN_EMOJI } from "../systems/sound-effects-system";

AFRAME.registerComponent("emoji", {
  schema: {
    emitDecayTime: { default: 1.5 },
    emitFadeTime: { default: 0.5 },
    emitEndTime: { default: 0 },
    particleEmitterConfig: {
      default: null,
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    }
  },

  init() {
    this.data.emitEndTime = performance.now() + this.data.emitDecayTime * 1000;
  },

  play() {
    this.lastLinearVelocity = this.el.components["body-helper"].body.physicsBody.getLinearVelocity().length2();
    this.lastAngularVelocity = this.el.components["body-helper"].body.physicsBody.getAngularVelocity().length2();
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playPositionalSoundFollowing(
      SOUND_SPAWN_EMOJI,
      this.el.object3D
    );
    this.particleEmitter = this.el.querySelector(".particle-emitter");
  },

  update() {
    if (!this.particleConfig && this.data.particleEmitterConfig) {
      this.particleConfig = Object.assign({}, this.data.particleEmitterConfig);
      this.originalParticleCount = this.particleConfig.particleCount;
    }
  },

  tick(t, dt) {
    const isMine = this.el.components.networked.initialized && this.el.components.networked.isMine();

    if (this.particleConfig && isMine) {
      const now = performance.now();

      const linearVelocity = this.el.components["body-helper"].body.physicsBody.getLinearVelocity().length2();
      const linearAcceleration = ((linearVelocity - this.lastLinearVelocity) / dt) * 1000;
      this.lastLinearVelocity = linearVelocity;

      const angularVelocity = this.el.components["body-helper"].body.physicsBody.getAngularVelocity().length2();
      const angularAcceleration = ((angularVelocity - this.lastAngularVelocity) / dt) * 1000;
      this.lastAngularVelocity = angularVelocity;

      if (Math.abs(linearAcceleration) > 10000 || Math.abs(angularAcceleration) > 10000) {
        this.data.emitEndTime = now + this.data.emitDecayTime * 1000;
      }

      const emitFadeTime = this.data.emitFadeTime * 1000;

      if (now < this.data.emitEndTime && this.particleConfig.startOpacity < 1) {
        this.particleConfig.particleCount = this.originalParticleCount;
        this.particleConfig.startOpacity = 1;
        this.particleConfig.middleOpacity = 1;
        this.particleEmitter.setAttribute("particle-emitter", this.particleConfig, true);
      } else if (now >= this.data.emitEndTime && this.particleConfig.startOpacity > 0.001) {
        const timeSinceStop = Math.min(now - this.data.emitEndTime, emitFadeTime);
        const opacity = 1 - timeSinceStop / emitFadeTime;
        const particleCount = opacity < 0.001 && this.particleConfig.particleCount > 0 ? 0 : this.originalParticleCount;
        this.particleConfig.particleCount = particleCount;
        this.particleConfig.startOpacity = opacity;
        this.particleConfig.middleOpacity = opacity;
        this.particleEmitter.setAttribute("particle-emitter", this.particleConfig, true);
      }
    }
  }
});
