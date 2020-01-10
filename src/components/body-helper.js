import { Body } from "three-ammo";
import { ACTIVATION_STATE, TYPE } from "three-ammo/constants";

const ACTIVATION_STATES = [
  ACTIVATION_STATE.ACTIVE_TAG,
  ACTIVATION_STATE.ISLAND_SLEEPING,
  ACTIVATION_STATE.WANTS_DEACTIVATION,
  ACTIVATION_STATE.DISABLE_DEACTIVATION,
  ACTIVATION_STATE.DISABLE_SIMULATION
];

AFRAME.registerComponent("body-helper", {
  schema: {
    loadedEvent: { default: "" },
    mass: { default: 1 },
    gravity: { type: "vec3", default: { x: 0, y: -9.8, z: 0 } },
    linearDamping: { default: 0.01 },
    angularDamping: { default: 0.01 },
    linearSleepingThreshold: { default: 1.6 },
    angularSleepingThreshold: { default: 2.5 },
    angularFactor: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    activationState: {
      default: ACTIVATION_STATE.ACTIVE_TAG,
      oneOf: ACTIVATION_STATES
    },
    type: { default: "dynamic", oneOf: [TYPE.STATIC, TYPE.DYNAMIC, TYPE.KINEMATIC] },
    emitCollisionEvents: { default: false },
    disableCollision: { default: false },
    collisionFilterGroup: { default: 1 }, //32-bit mask,
    collisionFilterMask: { default: 1 }, //32-bit mask
    scaleAutoUpdate: { default: true }
  },

  init: function() {
    this.system = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
    this.alive = true;
    this.system.registerBodyHelper(this);
  },

  init2: function() {
    this.body = new Body(this.data, this.el.object3D, this.system.world);
    this.system.addBody(this.body);
  },

  update: function(prevData) {
    if (prevData !== null && this.body) {
      this.body.update(this.data);
    }
  },

  remove: function() {
    if (this.body) {
      this.system.removeBody(this.body);
      this.body.destroy();
      this.body = null;
    }
    this.alive = false;
  }
});
