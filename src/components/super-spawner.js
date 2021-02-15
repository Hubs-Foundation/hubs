/* global require AFRAME THREE setTimeout clearTimeout */
import { addMedia } from "../utils/media-utils";
import { waitForEvent } from "../utils/async-utils";
import { ObjectContentOrigins } from "../object-types";
import { paths } from "../systems/userinput/paths";
import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

function setNonNullVec3Components(target, values) {
  target.set(
    values.x === null ? target.x : values.x,
    values.y === null ? target.y : values.y,
    values.z === null ? target.z : values.z
  );
}

/**
 * Spawns networked objects when grabbed or when a specified event is fired.
 * @namespace network
 * @component super-spawner
 */
AFRAME.registerComponent("super-spawner", {
  schema: {
    /**
     * Source of the media asset the spawner will spawn when grabbed. This can be a gltf, video, or image, or a url that the reticiulm media API can resolve to a gltf, video, or image.
     */
    src: { default: "" },

    /**
     * Whether to use the Reticulum media resolution API to interpret the src URL (e.g. find a video URL for Youtube videos.)
     */
    resolve: { default: false },

    /**
     * The template to use for this object
     */
    template: { default: "" },

    /**
     * Spawn the object with a custom scale, rather than copying that of the spawner.
     */
    spawnScale: { type: "vec3", default: { x: NaN, y: NaN, z: NaN } },

    /**
     * The spawner will become invisible and ungrabbable for this ammount of time after being grabbed. This can prevent rapidly spawning objects.
     */
    spawnCooldown: { default: 1 },

    /**
     * Optional event to listen for to spawn an object on the preferred superHand
     */
    spawnEvent: { type: "string" },

    /**
     * If true, will spawn the object at the cursor and animate it into the hand.
     */
    animateFromCursor: { type: "boolean" },

    mediaOptions: {
      default: {},
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    }
  },

  init() {
    this.cooldownTimeout = null;
    this.handPosition = new THREE.Vector3();

    this.onSpawnEvent = this.onSpawnEvent.bind(this);

    this.sceneEl = this.el.sceneEl;

    this.tempSpawnHandPosition = new THREE.Vector3();

    this.handleMediaLoaded = this.handleMediaLoaded.bind(this);

    this.spawnedMediaScale = null;

    this.physicsSystem = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
  },

  play() {
    this.el.addEventListener("media-loaded", this.handleMediaLoaded);
    if (this.data.spawnEvent) {
      this.el.sceneEl.addEventListener(this.data.spawnEvent, this.onSpawnEvent);
    }
  },

  pause() {
    this.el.removeEventListener("media-loaded", this.handleMediaLoaded);
    if (this.data.spawnEvent) {
      this.el.sceneEl.removeEventListener(this.data.spawnEvent, this.onSpawnEvent);
    }
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
      this.el.setAttribute("visible", true);
      this.el.classList.add("interactable");
    }
  },

  handleMediaLoaded(e) {
    const spawnedEntity = e.target;
    this.spawnedMediaScale = spawnedEntity.object3D.scale.clone();
    setNonNullVec3Components(this.spawnedMediaScale, this.data.spawnScale);

    const boxSize =
      spawnedEntity.components["media-image"] ||
      spawnedEntity.components["media-video"] ||
      spawnedEntity.components["media-pdf"]
        ? 1
        : 0.5;

    const scaleCoefficient = getScaleCoefficient(boxSize, getBox(spawnedEntity, spawnedEntity.object3D));
    this.spawnedMediaScale.divideScalar(scaleCoefficient);
  },

  async onSpawnEvent(e) {
    if (this.cooldownTimeout || !this.el.sceneEl.is("entered")) {
      return;
    }

    const spawnedEntity = addMedia(
      this.data.src,
      this.data.template,
      ObjectContentOrigins.SPAWNER,
      null,
      this.data.resolve,
      false,
      {
        x: this.data.spawnScale.x === null ? 1 : this.data.spawnScale.x,
        y: this.data.spawnScale.y === null ? 1 : this.data.spawnScale.y,
        z: this.data.spawnScale.z === null ? 1 : this.data.spawnScale.z
      },
      this.data.mediaOptions
    ).entity;

    const interaction = this.el.sceneEl.systems.interaction;
    if (!interaction.ready) return; //DOMContentReady workaround
    const cursor = (e.detail && e.detail.object3D) || interaction.options.rightRemote.entity.object3D;

    const left = cursor.el.id.indexOf("right") === -1;
    const hand = left ? interaction.options.leftHand.entity.object3D : interaction.options.rightHand.entity.object3D;
    cursor.getWorldPosition(spawnedEntity.object3D.position);
    cursor.getWorldQuaternion(spawnedEntity.object3D.quaternion);
    spawnedEntity.object3D.matrixNeedsUpdate = true;

    this.el.emit("spawned-entity-created", { target: spawnedEntity });

    const userinput = AFRAME.scenes[0].systems.userinput;
    const willAnimateFromCursor =
      this.data.animateFromCursor &&
      (userinput.get(paths.actions.rightHand.matrix) || userinput.get(paths.actions.leftHand.matrix));
    if (!willAnimateFromCursor) {
      if (left) {
        interaction.state.leftRemote.held = spawnedEntity;
        interaction.state.leftRemote.spawning = true;
      } else {
        interaction.state.rightRemote.held = spawnedEntity;
        interaction.state.rightRemote.spawning = true;
      }
    }
    this.activateCooldown();
    await waitForEvent("model-loaded", spawnedEntity);

    cursor.getWorldPosition(spawnedEntity.object3D.position);
    cursor.getWorldQuaternion(spawnedEntity.object3D.quaternion);
    spawnedEntity.object3D.matrixNeedsUpdate = true;

    if (willAnimateFromCursor) {
      hand.getWorldPosition(this.handPosition);
      spawnedEntity.setAttribute("animation__spawn-at-cursor", {
        property: "position",
        delay: 500,
        dur: 1500,
        from: {
          x: spawnedEntity.object3D.position.x,
          y: spawnedEntity.object3D.position.y,
          z: spawnedEntity.object3D.position.z
        },
        to: { x: this.handPosition.x, y: this.handPosition.y, z: this.handPosition.z },
        easing: "easeInOutBack"
      });
    } else {
      if (left) {
        interaction.state.leftRemote.spawning = false;
      } else {
        interaction.state.rightRemote.spawning = false;
      }
    }

    this.physicsSystem.resetDynamicBody(spawnedEntity.components["body-helper"].uuid);

    spawnedEntity.addEventListener(
      "media-loaded",
      () => {
        this.el.emit("spawned-entity-loaded", { target: spawnedEntity });
      },
      { once: true }
    );
  },

  activateCooldown() {
    if (this.data.spawnCooldown > 0) {
      const [sx, sy, sz] = [this.el.object3D.scale.x, this.el.object3D.scale.y, this.el.object3D.scale.z];

      this.el.setAttribute("visible", false);
      this.el.object3D.scale.set(0.001, 0.001, 0.001);
      this.el.object3D.matrixNeedsUpdate = true;
      this.el.classList.remove("interactable");
      this.el.setAttribute("body-helper", { collisionFilterMask: COLLISION_LAYERS.NONE });
      this.cooldownTimeout = setTimeout(() => {
        this.el.setAttribute("visible", true);
        this.el.classList.add("interactable");
        this.el.setAttribute("body-helper", { collisionFilterMask: COLLISION_LAYERS.DEFAULT_SPAWNER });
        this.el.removeAttribute("animation__spawner-cooldown");
        this.el.setAttribute("animation__spawner-cooldown", {
          property: "scale",
          delay: 50,
          dur: 350,
          from: { x: 0.001, y: 0.001, z: 0.001 },
          to: { x: sx, y: sy, z: sz },
          easing: "easeOutElastic"
        });

        setTimeout(() => {
          this.cooldownTimeout = null;
        }, 400);
      }, this.data.spawnCooldown * 1000);
    }
  }
});
