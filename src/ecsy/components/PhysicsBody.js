import { Types, Component } from "ecsy";
import { ThreeTypes } from "ecsy-three";
import { Vector3 } from "three";
import { CONSTANTS } from "three-ammo";

export const ACTIVATION_STATE = CONSTANTS.ACTIVATION_STATE;
export const TYPE = CONSTANTS.TYPE;

export const ACTIVATION_STATES = [
  ACTIVATION_STATE.ACTIVE_TAG,
  ACTIVATION_STATE.ISLAND_SLEEPING,
  ACTIVATION_STATE.WANTS_DEACTIVATION,
  ACTIVATION_STATE.DISABLE_DEACTIVATION,
  ACTIVATION_STATE.DISABLE_SIMULATION
];

export class PhysicsBody extends Component {
  toObject(obj = {}) {
    obj.mass = this.mass;
    obj.gravity = this.gravity;
    obj.linearDamping = this.linearDamping;
    obj.angularDamping = this.angularDamping;
    obj.linearSleepingThreshold = this.linearSleepingThreshold;
    obj.angularSleepingThreshold = this.angularSleepingThreshold;
    obj.angularFactor = this.angularFactor;
    obj.activationState = this.activationState;
    obj.type = this.type;
    obj.emitCollisionEvents = this.emitCollisionEvents;
    obj.disableCollision = this.disableCollision;
    obj.collisionFilterGroup = this.collisionFilterGroup;
    obj.collisionFilterMask = this.collisionFilterMask;
    obj.scaleAutoUpdate = this.scaleAutoUpdate;
    obj.collisions = this.collisions;
    obj.linearVelocity = this.linearVelocity;
    obj.angularVelocity = this.linearVelocity;
    obj.index = this.index;
    obj.shapes = this.shapes;
    obj.needsUpdate = this.needsUpdate;
    obj.uuid = this.uuid;
    return obj;
  }

  static schema = {
    mass: { type: Types.Number, default: 1 },
    gravity: { type: ThreeTypes.Vector3Type, default: new Vector3(0, -9.8, 0) },
    linearDamping: { type: Types.Number, default: 0.01 },
    angularDamping: { type: Types.Number, default: 0.01 },
    linearSleepingThreshold: { type: Types.Number, default: 1.6 },
    angularSleepingThreshold: { type: Types.Number, default: 2.5 },
    angularFactor: { type: Types.Number, default: new Vector3(1, 1, 1) },
    activationState: { type: Types.String, default: ACTIVATION_STATE.ACTIVE_TAG },
    type: { type: Types.String, default: TYPE.DYNAMIC },
    emitCollisionEvents: { type: Types.Boolean, default: false },
    disableCollision: { type: Types.Boolean, default: false },
    collisionFilterGroup: { type: Types.Number, default: 1 }, //32-bit mask
    collisionFilterMask: { type: Types.Number, default: 15 }, //32-bit mask
    scaleAutoUpdate: { type: Types.Boolean, default: true },
    collisions: { type: Types.Array, default: [] },
    linearVelocity: { type: Types.Number, default: 0 },
    angularVelocity: { type: Types.Number, default: 0 },
    index: { type: Types.Number, default: -1 },
    shapes: { type: Types.Array, default: [] },
    needsUpdate: { type: Types.Boolean, default: true },
    uuid: { type: Types.String, default: null }
  };
}
