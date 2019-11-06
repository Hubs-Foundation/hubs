import happyEmoji from "../assets/images/chest-emojis/screen-effect/happy.png";
import sadEmoji from "../assets/images/chest-emojis/screen-effect/sad.png";
import angryEmoji from "../assets/images/chest-emojis/screen-effect/angry.png";
import ewwEmoji from "../assets/images/chest-emojis/screen-effect/eww.png";
import disgustEmoji from "../assets/images/chest-emojis/screen-effect/disgust.png";
import heartsEmoji from "../assets/images/chest-emojis/screen-effect/hearts.png";
import smileEmoji from "../assets/images/chest-emojis/screen-effect/smile.png";
import surpriseEmoji from "../assets/images/chest-emojis/screen-effect/surprise.png";

import { TYPE } from "three-ammo/constants";

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

const emojiTypeToImage = {
  happy: happyEmoji,
  sad: sadEmoji,
  angry: angryEmoji,
  smile: smileEmoji,
  surprise: surpriseEmoji,
  eww: ewwEmoji,
  hearts: heartsEmoji,
  disgust: disgustEmoji
};

AFRAME.registerComponent("emoji-hud", {
  init() {
    const entity = document.createElement("a-entity");
    const url = new URL(emojiTypeToImage.happy, window.location.href).href;
    entity.setAttribute("media-loader", { src: url });
    entity.setAttribute("scale", { x: 0.25, y: 0.25, z: 0.25 });
    entity.setAttribute("is-remote-hover-target", "");
    entity.setAttribute("tags", { isHandCollisionTarget: true });
    entity.setAttribute("visibility-while-frozen", { requireHoverOnNonMobile: false });
    entity.setAttribute("css-class", "interactable");
    entity.setAttribute("body-helper", {
      mass: 0,
      type: TYPE.STATIC,
      collisionFilterGroup: COLLISION_LAYERS.INTERACTABLES,
      collisionFilterMask: COLLISION_LAYERS.DEFAULT_SPAWNER
    });
    const particleEmitterConfig = {
      src: url,
      resolve: false,
      particleCount: 10,
      startSize: 0.01,
      endSize: 0.1,
      sizeRandomness: 0.05,
      lifetime: 0.5,
      lifetimeRandomness: 0.1,
      ageRandomness: 0.1,
      startVelocity: { x: 0, y: 1, z: 0 },
      endVelocity: { x: 0, y: 0.5, z: 0 },
      startOpacity: 1,
      middleOpacity: 1,
      endOpacity: 0
    };
    entity.setAttribute("super-spawner", {
      src: url,
      template: "#interactable-emoji-media",
      spawnRotation: { x: 0, y: NaN, z: 0 },
      spawnedEntityCallback: spawnedEntity => {
        spawnedEntity.querySelector("#particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
        spawnedEntity.object3D.rotation.set(0, spawnedEntity.object3D.rotation.y, 0);
        spawnedEntity.object3D.matrixNeedsUpdate = true;
      }
    });
    this.el.appendChild(entity);
  }
});

AFRAME.registerComponent("emoji", {
  schema: {
    emitDecayTime: { default: 3 },
    emitFadeTime: { default: 0.5 },
    emitting: { default: false }
  },

  init() {
    this.lastEmitTime = 0;
  },

  play() {
    this.lastVelocity = this.el.components["body-helper"].body.getVelocity().length2();
  },

  tick(t, dt) {
    const acc = ((this.el.components["body-helper"].body.getVelocity().length2() - this.lastVelocity) / dt) * 1000;
    this.lastVelocity = this.el.components["body-helper"].body.getVelocity().length2();

    const particleEmitter =
      this.el.children[0] &&
      this.el.children[0].components["particle-emitter"] &&
      this.el.children[0].components["particle-emitter"];

    if (!this.particleConfig && particleEmitter) {
      this.particleConfig = particleEmitter.data;
      this.originalParticleCount = this.particleConfig.particleCount;
    }

    const now = Date.now();

    if (Math.abs(acc) > 10000) {
      this.lastEmitTime = now + this.data.emitDecayTime * 1000;
    }

    if (particleEmitter) {
      const currentParticleCount = particleEmitter.data.particleCount;
      const currentOpacity = particleEmitter.data.startOpacity;
      const emitFadeTime = this.data.emitFadeTime * 1000;
      if (this.lastEmitTime < now && currentOpacity > 0.001) {
        const timeSinceStop = Math.min(now - this.lastEmitTime, emitFadeTime);
        const opacity = 1 - timeSinceStop / emitFadeTime;
        const particleCount = opacity < 0.001 && currentParticleCount > 0 ? 0 : this.originalParticleCount;
        this.particleConfig.particleCount = particleCount;
        this.particleConfig.startOpacity = opacity;
        this.particleConfig.middleOpacity = opacity;
        particleEmitter.el.setAttribute("particle-emitter", this.particleConfig, true);
      } else if (this.lastEmitTime >= now && currentOpacity < 0.001) {
        this.particleConfig.particleCount = this.originalParticleCount;
        this.particleConfig.startOpacity = 1;
        this.particleConfig.middleOpacity = 1;
        particleEmitter.el.setAttribute("particle-emitter", this.particleConfig, true);
      }
    }
  }
});
