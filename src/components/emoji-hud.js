import { TYPE } from "three-ammo/constants";
import { emojis } from "./emoji";

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

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
    camera: { type: "selector", default: "#avatar-pov-node" },
    hudAngle: { default: -0.5 },
    minHudAngle: { default: -0.2 },
    maxHudAngle: { default: 0.7 },
    hudDistance: { default: 0.4 },
    spawnerPlatformWidth: { default: 0.0625 },
    spawnerPlatformSpacing: { default: 0.021 }
  },

  init: (() => {
    const cameraWorldPosition = new THREE.Vector3();
    const offsetVector = new THREE.Vector3();
    return function() {
      this._onFrozen = this._onFrozen.bind(this);
      this._onThaw = this._onThaw.bind(this);

      const width = this.data.spawnerPlatformWidth;
      const spacing = this.data.spawnerPlatformSpacing;

      this.spawnerEntities = [];

      for (let i = 0; i < emojis.length; i++) {
        const spawnerEntity = document.createElement("a-entity");
        spawnerEntity.setAttribute("media-loader", { src: emojis[i].model });
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
          const particleEmitterConfig = emojis[i].particleEmitterConfig;
          e.detail.target.querySelector(".particle-emitter").setAttribute("particle-emitter", particleEmitterConfig);
          e.detail.target.setAttribute("emoji", { particleEmitterConfig: particleEmitterConfig });
        });

        spawnerEntity.setAttribute("super-spawner", {
          src: emojis[i].model,
          template: "#interactable-emoji",
          spawnScale: { x: this.data.spawnedScale, y: this.data.spawnedScale, z: this.data.spawnedScale }
        });

        setOffsetVector(i, emojis.length, width, spacing, offsetVector);

        spawnerEntity.object3D.position.copy(offsetVector);
        spawnerEntity.object3D.matrixNeedsUpdate = true;

        this.el.appendChild(spawnerEntity);

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
