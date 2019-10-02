/* global require AFRAME THREE setTimeout clearTimeout */
import { addMedia } from "../utils/media-utils";
import { waitForEvent } from "../utils/async-utils";
import { ObjectContentOrigins } from "../object-types";
import { paths } from "../systems/userinput/paths";

const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

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
     * Whether to resize the media on load.
     */
    resize: { default: false },

    /**
     * The template to use for this object
     */
    template: { default: "" },

    /**
     * Spawn the object at a custom position, rather than at the center of the spanwer.
     */
    useCustomSpawnPosition: { default: false },
    spawnPosition: { type: "vec3" },

    /**
     * Spawn the object with a custom orientation, rather than copying that of the spawner.
     */
    useCustomSpawnRotation: { default: false },
    spawnRotation: { type: "vec4" },

    /**
     * Spawn the object with a custom scale, rather than copying that of the spawner.
     */
    useCustomSpawnScale: { default: false },
    spawnScale: { type: "vec3" },

    /**
     * The spawner will become invisible and ungrabbable for this ammount of time after being grabbed. This can prevent rapidly spawning objects.
     */
    spawnCooldown: { default: 1 },

    /**
     * Center the spawned object on the hand that grabbed it after it finishes loading. By default the object will be grabbed relative to where the spawner was grabbed
     */
    centerSpawnedObject: { default: false },

    /**
     * Optional event to listen for to spawn an object on the preferred superHand
     */
    spawnEvent: { type: "string" },

    /**
     * If true, will spawn the object at the cursor and animate it into the hand.
     */
    animateFromCursor: { type: "boolean" }
  },

  init() {
    this.cooldownTimeout = null;
    this.handPosition = new THREE.Vector3();

    this.onSpawnEvent = this.onSpawnEvent.bind(this);

    this.sceneEl = document.querySelector("a-scene");

    this.tempSpawnHandPosition = new THREE.Vector3();
  },

  play() {
    if (this.data.spawnEvent) {
      this.el.sceneEl.addEventListener(this.data.spawnEvent, this.onSpawnEvent);
    }
  },

  pause() {
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

  async onSpawnEvent(e) {
    if (this.cooldownTimeout || !this.el.sceneEl.is("entered")) {
      return;
    }

    const entity = addMedia(
      this.data.src,
      this.data.template,
      ObjectContentOrigins.SPAWNER,
      null,
      this.data.resolve,
      false
    ).entity;

    const cursor =
      (e.detail && e.detail.object3D) || this.el.sceneEl.systems.interaction.options.rightRemote.entity.object3D;
    const left = cursor.el.id.indexOf("right") === -1;
    const hand = left
      ? this.el.sceneEl.systems.interaction.options.leftHand.entity.object3D
      : this.el.sceneEl.systems.interaction.options.rightHand.entity.object3D;
    cursor.getWorldPosition(entity.object3D.position);
    cursor.getWorldQuaternion(entity.object3D.quaternion);
    entity.object3D.matrixNeedsUpdate = true;

    if (this.data.useCustomSpawnScale) {
      entity.object3D.scale.copy(this.data.spawnScale);
    }

    const userinput = AFRAME.scenes[0].systems.userinput;
    const interaction = AFRAME.scenes[0].systems.interaction;
    const willAnimateFromCursor =
      this.data.animateFromCursor &&
      (userinput.get(paths.actions.rightHand.matrix) || userinput.get(paths.actions.leftHand.matrix));
    if (!willAnimateFromCursor) {
      if (left) {
        interaction.state.leftRemote.held = entity;
        interaction.state.leftRemote.spawning = true;
      } else {
        interaction.state.rightRemote.held = entity;
        interaction.state.rightRemote.spawning = true;
      }
    }
    this.activateCooldown();
    await waitForEvent("model-loaded", entity);

    cursor.getWorldPosition(entity.object3D.position);
    cursor.getWorldQuaternion(entity.object3D.quaternion);
    entity.object3D.matrixNeedsUpdate = true;

    if (willAnimateFromCursor) {
      hand.getWorldPosition(this.handPosition);
      entity.setAttribute("animation__spawn-at-cursor", {
        property: "position",
        delay: 500,
        dur: 1500,
        from: { x: entity.object3D.position.x, y: entity.object3D.position.y, z: entity.object3D.position.z },
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
    if (entity.components["body-helper"].body) {
      entity.components["body-helper"].body.syncToPhysics(true);
    }
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

        this.cooldownTimeout = null;
      }, this.data.spawnCooldown * 1000);
    }
  }
});
