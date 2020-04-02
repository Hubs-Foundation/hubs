import emoji_particle_0 from "../assets/images/emojis/emoji_0.png";
import emoji_particle_1 from "../assets/images/emojis/emoji_1.png";
import emoji_particle_2 from "../assets/images/emojis/emoji_2.png";
import emoji_particle_3 from "../assets/images/emojis/emoji_3.png";
import emoji_particle_4 from "../assets/images/emojis/emoji_4.png";
import emoji_particle_5 from "../assets/images/emojis/emoji_5.png";
import emoji_particle_6 from "../assets/images/emojis/emoji_6.png";

import emoji_0 from "../assets/models/emojis/emoji_0.glb";
import emoji_1 from "../assets/models/emojis/emoji_1.glb";
import emoji_2 from "../assets/models/emojis/emoji_2.glb";
import emoji_3 from "../assets/models/emojis/emoji_3.glb";
import emoji_4 from "../assets/models/emojis/emoji_4.glb";
import emoji_5 from "../assets/models/emojis/emoji_5.glb";
import emoji_6 from "../assets/models/emojis/emoji_6.glb";

import { TYPE } from "three-ammo/constants";

import { paths } from "../systems/userinput/paths";

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

const EMOJIS = [emoji_0, emoji_1, emoji_2, emoji_3, emoji_4, emoji_5, emoji_6];
const particles = [
  emoji_particle_0,
  emoji_particle_1,
  emoji_particle_2,
  emoji_particle_3,
  emoji_particle_4,
  emoji_particle_5,
  emoji_particle_6
];

function setOffsetVector(i, totalNumEmojis, width, spacing, offsetVector) {
  const sign = i & 1 ? -1 : 1;
  offsetVector.y = 0;
  if (totalNumEmojis % 2 === 0) {
    offsetVector.x = (spacing / 2 + width / 2 + Math.floor(i / 2) * (width + spacing)) * sign;
    offsetVector.z = (Math.floor(i / 2) * width) / 2;
  } else if (i !== 0) {
    offsetVector.x = (width + spacing) * Math.floor((i + 1) / 2) * -sign;
    offsetVector.z = (Math.floor((i + 1) / 2) * width) / 2;
  }
}

AFRAME.registerComponent("emoji-hud", {
  schema: {
    spawnerScale: { default: 0.1 },
    spawnedScale: { default: 0.5 },
    camera: { type: "selector" },
    hudAngle: { default: -0.5 },
    minHudAngle: { default: -0.2 },
    maxHudAngle: { default: 0.7 },
    hudDistance: { default: 0.4 },
    spawnerPlatformWidth: { default: 0.0625 },
    spawnerPlatformSpacing: { default: 0.021 },
    spawnCooldown: { default: 1 }
  },

  init: (() => {
    const cameraWorldPosition = new THREE.Vector3();
    const offsetVector = new THREE.Vector3();
    return function() {
      this._onFrozen = this._onFrozen.bind(this);
      this._onThaw = this._onThaw.bind(this);

      const width = this.data.spawnerPlatformWidth;
      const spacing = this.data.spawnerPlatformSpacing;

      this.emojiUrls = [];
      this.spawnerEntities = [];
      this.spawnEvents = [];
      this.lastSpawnTime = 0;

      for (let i = 0; i < EMOJIS.length; i++) {
        const spawnerEntity = document.createElement("a-entity");
        const url = new URL(EMOJIS[i], window.location.href).href;
        this.emojiUrls.push(url);
        spawnerEntity.setAttribute("media-loader", { src: url });
        spawnerEntity.setAttribute("hoverable-visuals", "");
        spawnerEntity.setAttribute("scale", {
          x: this.data.spawnerScale,
          y: this.data.spawnerScale,
          z: this.data.spawnerScale
        });
        spawnerEntity.setAttribute("is-remote-hover-target", "");
        spawnerEntity.setAttribute("tags", { isHandCollisionTarget: false });
        spawnerEntity.setAttribute("visibility-while-frozen", {
          requireHoverOnNonMobile: false,
          withPermission: "spawn_emoji"
        });
        spawnerEntity.setAttribute("css-class", "interactable");
        spawnerEntity.setAttribute("body-helper", {
          mass: 0,
          type: TYPE.STATIC,
          collisionFilterGroup: COLLISION_LAYERS.INTERACTABLES,
          collisionFilterMask: COLLISION_LAYERS.DEFAULT_SPAWNER
        });

        const particle = new URL(particles[i], window.location.href).href;
        const particleEmitterConfig = {
          src: particle,
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
        };

        spawnerEntity.addEventListener("spawned-entity-created", e => {
          if (this.el.sceneEl.is("vr-mode")) {
            return;
          }
          const object3D = e.detail.target.object3D;
          const cameraObject3D = this.data.camera.object3D;
          object3D.updateMatrices();
          cameraObject3D.getWorldPosition(cameraWorldPosition);
          object3D.lookAt(cameraWorldPosition.x, object3D.position.y, cameraWorldPosition.z);
          object3D.matrixNeedsUpdate = true;
        });

        spawnerEntity.addEventListener("spawned-entity-loaded", e => {
          e.detail.target.querySelector(".particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
          e.detail.target.setAttribute("emoji", { particleEmitterConfig: particleEmitterConfig });
        });

        const spawnEvent = `spawnEmoji${i}`;
        this.spawnEvents.push(spawnEvent);

        spawnerEntity.setAttribute("super-spawner", {
          src: url,
          template: "#interactable-emoji",
          spawnScale: { x: this.data.spawnedScale, y: this.data.spawnedScale, z: this.data.spawnedScale },
          spawnEvent
        });

        const cylinder = document.createElement("a-cylinder");
        cylinder.setAttribute("visibility-while-frozen", {
          requireHoverOnNonMobile: false,
          withPermission: "spawn_emoji"
        });
        cylinder.setAttribute("material", { opacity: 0.2, color: "#2f7fee" });
        cylinder.setAttribute("segments-height", 1);
        cylinder.setAttribute("segments-radial", 16);
        cylinder.setAttribute("scale", { x: width / 2, y: width / 20, z: width / 5 });
        cylinder.setAttribute("rotation", { x: 45, y: 0, z: 0 });

        setOffsetVector(i, EMOJIS.length, width, spacing, offsetVector);

        spawnerEntity.object3D.position.copy(offsetVector);
        spawnerEntity.object3D.matrixNeedsUpdate = true;

        cylinder.object3D.position.set(offsetVector.x, -width / 2, offsetVector.z + 0.01); //move back to avoid transparency issues with emojis
        cylinder.object3D.matrixNeedsUpdate = true;

        this.el.appendChild(spawnerEntity);
        this.el.appendChild(cylinder);

        this.spawnerEntities.push(spawnerEntity);
      }
    };
  })(),

  play() {
    this.el.sceneEl.addEventListener("stateadded", this._onFrozen);
    this.el.sceneEl.addEventListener("stateremoved", this._onThaw);
    this._updateOffset();
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this._onFrozen);
    this.el.sceneEl.removeEventListener("stateremoved", this._onThaw);
  },

  tick() {
    if (
      window.APP.hubChannel &&
      window.APP.hubChannel.can("spawn_emoji") &&
      this.lastSpawnTime + this.data.spawnCooldown * 1000 < performance.now()
    ) {
      const userinput = AFRAME.scenes[0].systems.userinput;

      for (let i = 0; i < this.spawnEvents.length; i++) {
        if (userinput.get(paths.actions[this.spawnEvents[i]])) {
          this.lastSpawnTime = performance.now();
          this.el.sceneEl.emit(this.spawnEvents[i]);
          break;
        }
      }
    }
  },

  _onFrozen(e) {
    if (e.detail === "frozen") {
      this._updateOffset();
      for (let i = 0; i < this.spawnerEntities.length; i++) {
        this.spawnerEntities[i].components.tags.data.isHandCollisionTarget = true;
      }
    }
  },

  _onThaw(e) {
    if (e.detail === "frozen") {
      for (let i = 0; i < this.spawnerEntities.length; i++) {
        this.spawnerEntities[i].components.tags.data.isHandCollisionTarget = false;
      }
    }
  },

  _updateOffset: (function() {
    const targetWorldPos = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const projectedCameraForward = new THREE.Vector3();
    const angledCameraForward = new THREE.Vector3();
    const defaultRight = new THREE.Vector3(1, 0, 0);
    return function() {
      const obj = this.el.object3D;
      const cameraObject3D = this.data.camera.object3D;
      cameraObject3D.updateMatrices();
      cameraForward.set(0, 0, -1);
      cameraForward.transformDirection(cameraObject3D.matrixWorld);
      projectedCameraForward.set(0, 0, -1);
      projectedCameraForward.transformDirection(cameraObject3D.matrixWorld);
      projectedCameraForward.projectOnPlane(THREE.Object3D.DefaultUp).normalize();
      const angle =
        Math.sign(THREE.Object3D.DefaultUp.dot(cameraForward)) * projectedCameraForward.angleTo(cameraForward);
      const angleOffset = angle - Math.max(this.data.minHudAngle, Math.min(this.data.maxHudAngle, angle));
      angledCameraForward.set(0, 0, -1);
      angledCameraForward.applyAxisAngle(defaultRight, this.data.hudAngle - angleOffset);
      angledCameraForward.multiplyScalar(this.data.hudDistance);
      cameraObject3D.localToWorld(angledCameraForward);
      obj.parent.worldToLocal(angledCameraForward);
      obj.position.copy(angledCameraForward);
      obj.updateMatrices(true);
      cameraObject3D.getWorldPosition(targetWorldPos);
      obj.lookAt(targetWorldPos);
      obj.matrixNeedsUpdate = true;
    };
  })()
});
