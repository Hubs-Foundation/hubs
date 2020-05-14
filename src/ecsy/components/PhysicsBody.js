import { Component } from "ecsy";
import { Vector3 } from "three";
import { CONSTANTS } from "three-ammo";
import { PropTypes } from "ecsy-three";

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
  static schema = {
    mass: { type: PropTypes.Number, default: 1 },
    gravity: { type: PropTypes.Vector3, default: new Vector3(0, -9.8, 0) },
    linearDamping: { type: PropTypes.Number, default: 0.01 },
    angularDamping: { type: PropTypes.Number, default: 0.01 },
    linearSleepingThreshold: { type: PropTypes.Number, default: 1.6 },
    angularSleepingThreshold: { type: PropTypes.Number, default: 2.5 },
    angularFactor: { type: PropTypes.Number, default: new Vector3(1, 1, 1) },
    activationState: { type: PropTypes.String, default: ACTIVATION_STATE.ACTIVE_TAG },
    type: { type: PropTypes.String, default: TYPE.DYNAMIC },
    emitCollisionEvents: { type: PropTypes.Boolean, default: false },
    disableCollision: { type: PropTypes.Boolean, default: false },
    collisionFilterGroup: { type: PropTypes.Number, default: 1 }, //32-bit mask
    collisionFilterMask: { type: PropTypes.Number, default: 15 }, //32-bit mask
    scaleAutoUpdate: { type: PropTypes.Boolean, default: true },
    collisions: { type: PropTypes.Array, default: [] },
    linearVelocity: { type: PropTypes.Number, default: 0 },
    angularVelocity: { type: PropTypes.Number, default: 0 },
    index: { type: PropTypes.Number, default: -1 },
    shapes: { type: PropTypes.Array, default: [] },
    needsUpdate: { type: PropTypes.Boolean, default: true },
    uuid: { type: PropTypes.String, default: null }
  };
}
