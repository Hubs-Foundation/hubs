/* global performance */
import { addMedia } from "../utils/media-utils";
import { SOUND_SPAWN_EMOJI } from "../systems/sound-effects-system";
import emoji0Particle from "../assets/images/emojis/emoji_0.png";
import emoji1Particle from "../assets/images/emojis/emoji_1.png";
import emoji2Particle from "../assets/images/emojis/emoji_2.png";
import emoji3Particle from "../assets/images/emojis/emoji_3.png";
import emoji4Particle from "../assets/images/emojis/emoji_4.png";
import emoji5Particle from "../assets/images/emojis/emoji_5.png";
import emoji6Particle from "../assets/images/emojis/emoji_6.png";
import emoji0Model from "../assets/models/emojis/emoji_0.glb";
import emoji1Model from "../assets/models/emojis/emoji_1.glb";
import emoji2Model from "../assets/models/emojis/emoji_2.glb";
import emoji3Model from "../assets/models/emojis/emoji_3.glb";
import emoji4Model from "../assets/models/emojis/emoji_4.glb";
import emoji5Model from "../assets/models/emojis/emoji_5.glb";
import emoji6Model from "../assets/models/emojis/emoji_6.glb";

export const emojis = [
  { id: "smile", model: emoji0Model, particle: emoji0Particle },
  { id: "laugh", model: emoji1Model, particle: emoji1Particle },
  { id: "clap", model: emoji2Model, particle: emoji2Particle },
  { id: "heart", model: emoji3Model, particle: emoji3Particle },
  { id: "wave", model: emoji4Model, particle: emoji4Particle },
  { id: "angry", model: emoji5Model, particle: emoji5Particle },
  { id: "cry", model: emoji6Model, particle: emoji6Particle }
].map(({ model, particle, ...rest }) => {
  return {
    ...rest,
    model: new URL(model, window.location).href,
    particleEmitterConfig: {
      src: new URL(particle, window.location).href,
      resolve: false,
      particleCount: 20,
      startSize: 0.01,
      endSize: 0.2,
      sizeRandomness: 0.05,
      lifetime: 1,
      lifetimeRandomness: 0.2,
      ageRandomness: 1,
      startVelocity: { x: 0, y: 1, z: 0 },
      endVelocity: { x: 0, y: 0.25, z: 0 },
      startOpacity: 1,
      middleOpacity: 1,
      endOpacity: 0
    }
  };
});

export function spawnEmojiInFrontOfUser({ model, particleEmitterConfig }) {
  const { entity } = addMedia(model, "#interactable-emoji");
  entity.setAttribute("offset-relative-to", {
    target: "#avatar-pov-node",
    offset: { x: 0, y: 0, z: -1.5 }
  });
  entity.addEventListener("model-loaded", () => {
    entity.querySelector(".particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
    entity.setAttribute("emoji", { particleEmitterConfig: particleEmitterConfig });
  });
}

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
    this.physicsSystem = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
  },

  play() {
    const mediaLoader = this.el.components["media-loader"];
    if (emojis.find(emoji => emoji.model !== mediaLoader.data.src) === -1) {
      this.el.parentNode.removeChild(this.el);
      return;
    }

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

  tick() {
    const isMine = this.el.components.networked.initialized && this.el.components.networked.isMine();

    if (this.particleConfig && isMine) {
      const now = performance.now();

      const isHeld = this.el.sceneEl.systems.interaction.isHeld(this.el);

      if (isHeld) {
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
