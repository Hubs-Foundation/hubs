import { ParticleEmitter } from "@mozillareality/three-particle-emitter";
import { textureLoader } from "../utils/media-utils";
import { resolveUrl } from "../utils/media-utils";
import { proxiedUrlFor } from "../utils/media-url-utils";

AFRAME.registerComponent("particle-emitter", {
  schema: {
    resolve: { type: "boolean", default: true },
    src: { type: "string" },
    startColor: { type: "color" },
    middleColor: { type: "color" },
    endColor: { type: "color" },
    startOpacity: { type: "number" },
    middleOpacity: { type: "number" },
    endOpacity: { type: "number" },
    colorCurve: { type: "string" },
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

  async setTexture(src, resolve) {
    let accessibleUrl = src;

    if (resolve) {
      const result = await resolveUrl(src);
      let canonicalUrl = result.origin;

      // handle protocol relative urls
      if (canonicalUrl.startsWith("//")) {
        canonicalUrl = location.protocol + canonicalUrl;
      }

      // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
      accessibleUrl = proxiedUrlFor(canonicalUrl, null);
    }

    const texture = new THREE.Texture();

    await textureLoader.loadTextureAsync(texture, accessibleUrl);

    // Guard against src changing while request was in flight
    if (this.data.src !== src) {
      return;
    }

    this.particleEmitter.material.uniforms.map.value = texture;
    this.particleEmitter.visible = true;
    this.updateParticles = true;
  },

  update(prevData) {
    const data = this.data;
    const particleEmitter = this.particleEmitter;

    if (prevData.src !== data.src) {
      this.setTexture(data.src, data.resolve).catch(console.error);
    }

    if (
      prevData.startColor !== data.startColor ||
      prevData.startSize !== data.startSize ||
      prevData.sizeRandomness !== data.sizeRandomness ||
      prevData.ageRandomness !== data.ageRandomness ||
      prevData.lifetime !== data.lifetime ||
      prevData.lifetimeRandomness !== data.lifetimeRandomness ||
      prevData.particleCount !== data.particleCount
    ) {
      this.updateParticles = true;
    }

    particleEmitter.startColor.set(data.startColor);
    particleEmitter.middleColor.set(data.middleColor);
    particleEmitter.endColor.set(data.endColor);
    particleEmitter.startOpacity = data.startOpacity;
    particleEmitter.middleOpacity = data.middleOpacity;
    particleEmitter.endOpacity = data.endOpacity;
    particleEmitter.colorCurve = data.colorCurve;
    particleEmitter.sizeCurve = data.sizeCurve;
    particleEmitter.startSize = data.startSize;
    particleEmitter.endSize = data.endSize;
    particleEmitter.sizeRandomness = data.sizeRandomness;
    particleEmitter.ageRandomness = data.ageRandomness;
    particleEmitter.lifetime = data.lifetime;
    particleEmitter.lifetimeRandomness = data.lifetimeRandomness;
    particleEmitter.particleCount = data.particleCount;
    particleEmitter.startVelocity.copy(data.startVelocity);
    particleEmitter.endVelocity.copy(data.endVelocity);
    particleEmitter.velocityCurve = data.velocityCurve;
    particleEmitter.angularVelocity = data.angularVelocity;
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
