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
  schema: {
    spawnerScale: { default: 0.0625 },
    spawnedScale: { default: 0.25 },
    camera: { type: "selector" },
    hudAngle: { default: -0.4 },
    minHudAngle: { default: -0.2 },
    maxHudAngle: { default: 0.7 },
    hudDistance: { default: 0.4 }
  },

  init: (() => {
    const cameraWorldPosition = new THREE.Vector3();
    return function() {
      this._onFrozen = this._onFrozen.bind(this);

      const width = this.data.spawnerScale;
      const spacing = width / 3;

      for (let i = 0; i < emojis.length; i++) {
        const spawnerEntity = document.createElement("a-entity");
        const url = new URL(emojis[i], window.location.href).href;
        spawnerEntity.setAttribute("media-loader", { src: url, mediaOptions: { batch: false } });
        spawnerEntity.setAttribute("hoverable-visuals", "");
        spawnerEntity.setAttribute("scale", { x: width, y: width, z: width });
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
          particleCount: 20,
          startSize: 0.01,
          endSize: 0.1,
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
          e.detail.target.querySelector("#particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
        });

        spawnerEntity.setAttribute("super-spawner", {
          src: url,
          template: "#interactable-emoji-media",
          spawnScale: { x: this.data.spawnedScale, y: this.data.spawnedScale, z: this.data.spawnedScale },
          mediaOptions: { batch: false }
        });

        const cylinder = document.createElement("a-cylinder");
        cylinder.setAttribute("visibility-while-frozen", { requireHoverOnNonMobile: false });
        cylinder.setAttribute("material", { opacity: 0.2, color: "#2f7fee" });
        cylinder.setAttribute("segments-height", 1);
        cylinder.setAttribute("segments-radial", 16);
        cylinder.setAttribute("scale", { x: width / 2, y: width / 20, z: width / 5 });
        cylinder.setAttribute("rotation", { x: 45, y: 0, z: 0 });

        //evenly space out the emojis
        const sign = i & 1 ? -1 : 1;
        let x = 0;
        let z = 0;
        if (emojis.length % 2 === 0) {
          x = (spacing / 2 + width / 2 + Math.floor(i / 2) * (width + spacing)) * sign;
          z = (Math.floor(i / 2) * width) / 2;
        } else if (i !== 0) {
          x = (width + spacing) * Math.floor((i + 1) / 2) * -sign;
          z = Math.floor(((i + 1) / 2) * width) / 2;
        }
        spawnerEntity.object3D.position.x = x;
        spawnerEntity.object3D.position.z = z;
        spawnerEntity.object3D.matrixNeedsUpdate = true;

        cylinder.object3D.position.x = x;
        cylinder.object3D.position.y = -width / 2;
        cylinder.object3D.position.z = z + 0.01; //move back to avoid transparency issues with emojis
        cylinder.object3D.matrixNeedsUpdate = true;

        this.el.appendChild(spawnerEntity);
        this.el.appendChild(cylinder);
      }
    };
  })(),

  play() {
    this.el.sceneEl.addEventListener("stateadded", this._onFrozen);
    this._updateOffset();
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this._onFrozen);
  },

  _onFrozen(e) {
    if (e.detail === "frozen") {
      this._updateOffset();
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
