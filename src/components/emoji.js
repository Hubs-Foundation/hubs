/* global performance */
AFRAME.registerComponent("emoji", {
  schema: {
    emitDecayTime: { default: 1.5 },
    emitFadeTime: { default: 0.5 },
    emitEndTime: { default: 0 }
  },

  init() {
    this.data.emitEndTime = performance.now() + this.data.emitDecayTime * 1000;
  },

  play() {
    this.lastVelocity = this.el.components["body-helper"].body.getVelocity().length2();
  },

  tick(t, dt) {
    const particleEmitter =
      this.el.children[0] &&
      this.el.children[0].components["particle-emitter"] &&
      this.el.children[0].components["particle-emitter"];

    if (!this.particleConfig && particleEmitter) {
      this.particleConfig = particleEmitter.data;
      this.originalParticleCount = this.particleConfig.particleCount;
    }

    const isMine = this.el.components.networked.initialized && this.el.components.networked.isMine();

    if (particleEmitter && isMine) {
      const now = performance.now();

      const acc = ((this.el.components["body-helper"].body.getVelocity().length2() - this.lastVelocity) / dt) * 1000;
      this.lastVelocity = this.el.components["body-helper"].body.getVelocity().length2();

      if (Math.abs(acc) > 10000) {
        this.data.emitEndTime = now + this.data.emitDecayTime * 1000;
      }

      const currentParticleCount = particleEmitter.data.particleCount;
      const currentOpacity = particleEmitter.data.startOpacity;
      const emitFadeTime = this.data.emitFadeTime * 1000;

      if (now < this.data.emitEndTime && currentOpacity < 0.001) {
        this.particleConfig.particleCount = this.originalParticleCount;
        this.particleConfig.startOpacity = 1;
        this.particleConfig.middleOpacity = 1;
        particleEmitter.el.setAttribute("particle-emitter", this.particleConfig, true);
      } else if (now >= this.data.emitEndTime && currentOpacity > 0.001) {
        const timeSinceStop = Math.min(now - this.data.emitEndTime, emitFadeTime);
        const opacity = 1 - timeSinceStop / emitFadeTime;
        const particleCount = opacity < 0.001 && currentParticleCount > 0 ? 0 : this.originalParticleCount;
        this.particleConfig.particleCount = particleCount;
        this.particleConfig.startOpacity = opacity;
        this.particleConfig.middleOpacity = opacity;
        particleEmitter.el.setAttribute("particle-emitter", this.particleConfig, true);
      }
    }
  }
});
