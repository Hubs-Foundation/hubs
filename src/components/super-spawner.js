import { paths } from "../systems/userinput/paths";
import { addMedia } from "../utils/media-utils";
import { waitForEvent } from "../utils/async-utils";
import { ObjectContentOrigins } from "../object-types";

const COLLISION_FLAG = require("aframe-physics-system/src/constants").COLLISION_FLAG;

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

    this.onSpawnEvent = this.onSpawnEvent.bind(this);

    this.sceneEl = document.querySelector("a-scene");

    this.tempSpawnHandPosition = new THREE.Vector3();

    //need to add this here because super-spawners don't use addMedia()
    this.el.addState("media-scale-ready");
  },

  play() {
    if (this.data.spawnEvent) {
      this.sceneEl.addEventListener(this.data.spawnEvent, this.onSpawnEvent);
    }
  },

  pause() {
    if (this.data.spawnEvent) {
      this.sceneEl.removeEventListener(this.data.spawnEvent, this.onSpawnEvent);
    }
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
      this.el.setAttribute("visible", true);
      this.el.classList.add("interactable");
    }
  },

  async onSpawnEvent() {
    const userinput = AFRAME.scenes[0].systems.userinput;

    if (this.cooldownTimeout) {
      return;
    }

    const entity = addMedia(this.data.src, this.data.template, ObjectContentOrigins.SPAWNER, this.data.resolve).entity;

    const cursor = document.querySelector("#cursor");
    cursor.object3D.getWorldPosition(entity.object3D.position);
    cursor.object3D.getWorldQuaternion(entity.object3D.quaternion);
    entity.object3D.matrixNeedsUpdate = true;

    if (this.data.useCustomSpawnScale) {
      entity.object3D.scale.copy(this.data.spawnScale);
    }

    this.activateCooldown();

    AFRAME.scenes[0].systems.interaction.state.rightRemote.held = entity;
    AFRAME.scenes[0].systems.interaction.state.rightRemote.spawning = true;
    await waitForEvent("body-loaded", entity);
    AFRAME.scenes[0].systems.interaction.state.rightRemote.spawning = false;
    cursor.object3D.getWorldPosition(entity.object3D.position);
    cursor.object3D.getWorldQuaternion(entity.object3D.quaternion);
    entity.object3D.matrixNeedsUpdate = true;
    entity.components["ammo-body"].syncToPhysics();
  },

  activateCooldown() {
    if (this.data.spawnCooldown > 0) {
      this.el.setAttribute("visible", false);
      this.el.classList.remove("interactable");
      this.el.setAttribute("ammo-body", { collisionFlags: COLLISION_FLAG.NO_CONTACT_RESPONSE });
      this.cooldownTimeout = setTimeout(() => {
        this.el.setAttribute("visible", true);
        this.el.classList.add("interactable");
        this.el.setAttribute("ammo-body", { collisionFlags: COLLISION_FLAG.STATIC_OBJECT });
        this.cooldownTimeout = null;
      }, this.data.spawnCooldown * 1000);
    }
  }
});
