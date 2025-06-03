import { addComponent, removeComponent } from "bitecs";
import { CONSTANTS } from "three-ammo";
import { Rigidbody } from "../bit-components";
import { validatePhysicsParams } from "../utils/validatePhysicsParams";

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
    collisionFilterGroup: { default: 1 },
    collisionFilterMask: { default: 1 },
    scaleAutoUpdate: { default: true }
  },

  validateConfig(data) {
    if (typeof data.mass !== "number" || isNaN(data.mass)) {
      console.warn(`[body-helper] Invalid mass: ${data.mass}. Defaulting to 1.`);
      data.mass = 1;
    }

    const validTypes = [TYPE.STATIC, TYPE.DYNAMIC, TYPE.KINEMATIC];
    if (!validTypes.includes(data.type)) {
      console.warn(`[body-helper] Invalid type: ${data.type}. Defaulting to dynamic.`);
      data.type = TYPE.DYNAMIC;
    }

    if (!data.gravity || typeof data.gravity !== "object") {
      console.warn("[body-helper] Invalid gravity vector. Using default gravity.");
      data.gravity = { x: 0, y: -9.8, z: 0 };
    }
  },

  init: function () {
    this.validateConfig(this.data);

    this.system = this.el.sceneEl.systems["hubs-systems"].physicsSystem;
    this.alive = true;
    this.el.object3D.updateMatrices();
    this.uuid = this.system.addBody(this.el.object3D, this.data);
    this.data = validatePhysicsParams(this.data);

    const eid = this.el.object3D.eid;
    addComponent(APP.world, Rigidbody, eid);
    Rigidbody.bodyId[eid] = this.uuid;
  },

  update: function (prevData) {
    if (prevData) {
      this.validateConfig(this.data);
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

