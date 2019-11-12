import emoji_0 from "../assets/images/emojis/emoji_0.png";
import emoji_1 from "../assets/images/emojis/emoji_1.png";
import emoji_2 from "../assets/images/emojis/emoji_2.png";
import emoji_3 from "../assets/images/emojis/emoji_3.png";
import emoji_4 from "../assets/images/emojis/emoji_4.png";
import emoji_5 from "../assets/images/emojis/emoji_5.png";

import { TYPE } from "three-ammo/constants";

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

const emojis = [emoji_0, emoji_1, emoji_2, emoji_3, emoji_4, emoji_5];

AFRAME.registerComponent("emoji-hud", {
  init() {
    const spawnerEntity = document.createElement("a-entity");
    const url = new URL(emojis[0], window.location.href).href;
    spawnerEntity.setAttribute("media-loader", { src: url });
    spawnerEntity.setAttribute("scale", { x: 0.125, y: 0.125, z: 0.125 });
    spawnerEntity.setAttribute("is-remote-hover-target", "");
    spawnerEntity.setAttribute("tags", { isHandCollisionTarget: true });
    spawnerEntity.setAttribute("visibility-while-frozen", { requireHoverOnNonMobile: false });
    spawnerEntity.setAttribute("css-class", "interactable");
    spawnerEntity.setAttribute("body-helper", {
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
    spawnerEntity.addEventListener("spawned-entity-loaded", e => {
      e.detail.target.querySelector("#particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
      e.detail.target.object3D.matrixNeedsUpdate = true;
    });
    spawnerEntity.setAttribute("vertical-billboard-spawner-helper", "");
    spawnerEntity.setAttribute("super-spawner", {
      src: url,
      template: "#interactable-emoji-media",
      spawnScale: { x: 0.25, y: 0.25, z: 0.25 }
    });
    this.el.appendChild(spawnerEntity);
  }
});
