import { Component } from "ecsy";
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
  constructor() {
    super();
    this.mass = 1;
    this.gravity = new Vector3(0, 9.8, 0);
    this.linearDamping = 0.01;
    this.angularDamping = 0.01;
    this.linearSleepingThreshold = 1.6;
    this.angularSleepingThreshold = 2.5;
    this.angularFactor = new Vector3(1, 1, 1);
    this.activationState = ACTIVATION_STATE.ACTIVE_TAG;
    this.type = TYPE.DYNAMIC;
    this.emitCollisionEvents = false;
    this.disableCollision = false;
    this.collisionFilterGroup = 1; //32-bit mask
    this.collisionFilterMask = 15; //32-bit mask
    this.scaleAutoUpdate = true;
    this.collisions = [];
    this.linearVelocity = 0;
    this.angularVelocity = 0;
    this.index = -1;
    this.shapes = [];
    this.needsUpdate = true;
    this.uuid = null;
  }
}
