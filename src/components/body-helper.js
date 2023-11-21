import { addComponent, removeComponent } from "bitecs";
import { CONSTANTS } from "three-ammo";
import { Rigidbody } from "../bit-components";
import { updateBodyParams } from "../inflators/rigid-body";
const ACTIVATION_STATE = CONSTANTS.ACTIVATION_STATE,
  TYPE = CONSTANTS.TYPE;

export const ACTIVATION_STATES = [
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

  init: function () {
    this.system = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
    this.alive = true;
    this.el.object3D.updateMatrices();
    this.uuid = this.system.addBody(this.el.object3D, this.data);
    const eid = this.el.object3D.eid;
    addComponent(APP.world, Rigidbody, eid);
    updateBodyParams(eid, this.data);
    Rigidbody.bodyId[eid] = this.uuid; //uuid is a lie, it's actually an int
  },

  update: function (prevData) {
    if (prevData) {
      const eid = this.el.object3D.eid;
      this.system.updateRigidBody(eid, this.data);
    }
  },

  remove: function () {
    this.system.removeBody(this.uuid);
    const eid = this.el.object3D.eid;
    removeComponent(APP.world, Rigidbody, eid);
    this.alive = false;
  }
});
