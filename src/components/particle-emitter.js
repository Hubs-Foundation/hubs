import { ParticleEmitter } from "@mozillareality/three-particle-emitter";
import { textureLoader } from "../utils/media-utils";

AFRAME.registerComponent("particle-emitter", {
  schema: {
    src: { type: "string" },
    startColor: { type: "color" },
    middleColor: { type: "color" },
    endColor: { type: "color" },
    startOpacity: { type: "number" },
    middleOpacity: { type: "number" },
    endOpacity: { type: "number" },
    colorCurve: { type: "string" },
    emitterHeight: { type: "number" },
    emitterWidth: { type: "number" },
    sizeCurve: { type: "string" },
    startSize: { type: "number" },
    endSize: { type: "number" },
    sizeRandomness: { type: "number" },
    ageRandomness: { type: "number" },
    lifetime: { type: "number" },
    lifetimeRandomness: { type: "number" },
    particleCount: { type: "number" },
    startVelocity: { type: "vec3" },
    endVelocity: { type: "vec3" },
    velocityCurve: { type: "string" },
    angularVelocity: { type: "number" }
  },

  init() {
    this.particleEmitter = new ParticleEmitter(null);
    this.particleEmitter.visible = false;
    this.el.setObject3D("particle-emitter", this.particleEmitter);
    this.updateParticles = false;
  },

  update(prevData) {
    const data = this.data;
    const particleEmitter = this.particleEmitter;

    if (prevData.src !== data.src) {
      this.textureLoaded = false;
      textureLoader.load(
        data.src,
        texture => {
          this.particleEmitter.material.uniforms.map.value = texture;
          this.particleEmitter.visible = true;
          this.updateParticles = true;
        },
        undefined,
        console.error
      );
    }

    if (prevData.startColor !== data.startColor) {
      particleEmitter.startColor.set(data.startColor);
      this.updateParticles = true;
    }

    if (prevData.middleColor !== data.middleColor) {
      particleEmitter.middleColor.set(data.middleColor);
    }

    if (prevData.endColor !== data.endColor) {
      particleEmitter.endColor.set(data.endColor);
    }

    if (prevData.startOpacity !== data.startOpacity) {
      particleEmitter.startOpacity = data.startOpacity;
    }

    if (prevData.middleOpacity !== data.middleOpacity) {
      particleEmitter.middleOpacity = data.middleOpacity;
    }

    if (prevData.endOpacity !== data.endOpacity) {
      particleEmitter.endOpacity = data.endOpacity;
    }

    if (prevData.colorCurve !== data.colorCurve) {
      particleEmitter.colorCurve = data.colorCurve;
    }

    if (prevData.emitterHeight !== data.emitterHeight) {
      particleEmitter.emitterHeight = data.emitterHeight;
      this.updateParticles = true;
    }

    if (prevData.emitterWidth !== data.emitterWidth) {
      particleEmitter.emitterWidth = data.emitterWidth;
      this.updateParticles = true;
    }

    if (prevData.sizeCurve !== data.sizeCurve) {
      particleEmitter.sizeCurve = data.sizeCurve;
    }

    if (prevData.startSize !== data.startSize) {
      particleEmitter.startSize = data.startSize;
      this.updateParticles = true;
    }

    if (prevData.endSize !== data.endSize) {
      particleEmitter.endSize = data.endSize;
    }

    if (prevData.sizeRandomness !== data.sizeRandomness) {
      particleEmitter.sizeRandomness = data.sizeRandomness;
      this.updateParticles = true;
    }

    if (prevData.ageRandomness !== data.ageRandomness) {
      particleEmitter.ageRandomness = data.ageRandomness;
      this.updateParticles = true;
    }

    if (prevData.lifetime !== data.lifetime) {
      particleEmitter.lifetime = data.lifetime;
      this.updateParticles = true;
    }

    if (prevData.lifetimeRandomness !== data.lifetimeRandomness) {
      particleEmitter.lifetimeRandomness = data.lifetimeRandomness;
      this.updateParticles = true;
    }

    if (prevData.particleCount !== data.particleCount) {
      particleEmitter.particleCount = data.particleCount;
      this.updateParticles = true;
    }

    if (prevData.startVelocity !== data.startVelocity) {
      particleEmitter.startVelocity.copy(data.startVelocity);
    }

    if (prevData.endVelocity !== data.endVelocity) {
      particleEmitter.endVelocity.copy(data.endVelocity);
    }

    if (prevData.velocityCurve !== data.velocityCurve) {
      particleEmitter.velocityCurve = data.velocityCurve;
    }

    if (prevData.angularVelocity !== data.angularVelocity) {
      particleEmitter.angularVelocity = data.angularVelocity;
    }
  },

  tick(time, dt) {
    if (this.updateParticles) {
      this.particleEmitter.updateParticles();
      this.updateParticles = false;
    }

    if (this.particleEmitter.visible) {
      this.particleEmitter.update(dt / 1000);
    }
  }
});
