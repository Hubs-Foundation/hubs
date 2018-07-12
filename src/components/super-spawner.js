import { addMedia } from "../utils/media-utils";

const waitForEvent = function(eventName, eventObj) {
  return new Promise(resolve => {
    eventObj.addEventListener(eventName, resolve, { once: true });
  });
};

let nextGrabId = 0;
/**
 * Spawns networked objects when grabbed.
 * @namespace network
 * @component super-spawner
 */
AFRAME.registerComponent("super-spawner", {
  schema: {
    src: { default: "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf" },

    useCustomSpawnPosition: { default: false },
    spawnPosition: { type: "vec3" },

    useCustomSpawnRotation: { default: false },
    spawnRotation: { type: "vec4" },

    grabEvents: { default: ["cursor-grab", "hand_grab"] },
    releaseEvents: { default: ["cursor-release", "hand_release"] },

    spawnCooldown: { default: 1 }
  },

  init() {
    this.heldEntities = new Map();
    this.cooldownTimeout = null;
    this.handleGrabStart = this.handleGrabStart.bind(this);
    this.onGrabEnd = this.onGrabEnd.bind(this);
  },

  play() {
    this.el.addEventListener("grab-start", this.handleGrabStart);
    this.el.addEventListener("grab-end", this.onGrabEnd);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.handleGrabStart);
    this.el.removeEventListener("grab-end", this.onGrabEnd);

    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
      this.el.setAttribute("visible", true);
      this.el.classList.add("interactable");
    }
  },

  remove() {
    this.heldEntities.clear();
  },

  onGrabEnd(e) {
    this.heldEntities.delete(e.detail.hand);
    // This tells super-hands we are handling this releae
    e.preventDefault();
  },

  activateCooldown() {
    if (this.data.spawnCooldown > 0) {
      this.el.setAttribute("visible", false);
      this.el.classList.remove("interactable");
      this.cooldownTimeout = setTimeout(() => {
        this.el.setAttribute("visible", true);
        this.el.classList.add("interactable");
        this.cooldownTimeout = null;
      }, this.data.spawnCooldown * 1000);
    }
  },

  async handleGrabStart(e) {
    if (this.cooldownTimeout) {
      return;
    }

    // This tells super-hands we are handling this grab. The user is now "grabbing" the spawner
    e.preventDefault();

    const hand = e.detail.hand;
    const thisGrabId = nextGrabId++;
    this.heldEntities.set(hand, thisGrabId);

    const entity = await addMedia(this.data.src);
    entity.object3D.position.copy(
      this.data.useCustomSpawnPosition ? this.data.spawnPosition : this.el.object3D.position
    );
    entity.object3D.rotation.copy(
      this.data.useCustomSpawnRotation ? this.data.spawnRotation : this.el.object3D.rotation
    );

    this.activateCooldown();

    await waitForEvent("body-loaded", entity);

    // If we are still holding the spawner with the hand that grabbed to create this entity, release the spawner and grab the entity
    if (this.heldEntities.get(hand) === thisGrabId) {
      entity.body.position.copy(hand.object3D.position);
      entity.body.velocity.set(0, 0, 0);
      for (let i = 0; i < this.data.grabEvents.length; i++) {
        hand.emit(this.data.releaseEvents[i]);
        hand.emit(this.data.grabEvents[i], { targetEntity: entity });
      }
    }
  }
});
