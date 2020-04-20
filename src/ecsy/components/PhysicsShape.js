import { Component } from "ecsy";
import { Vector3, Quaternion } from "three";
import { SHAPE, FIT } from "three-ammo/constants";

export class PhysicsShape extends Component {
  constructor() {
    super();
    this.type = SHAPE.BOX;
    this.fit = FIT.ALL;
    this.halfExtents = new Vector3(1, 1, 1);
    this.minHalfExtent = 0.04;
    this.maxHalfExtent = Number.POSITIVE_INFINITY;
    this.sphereRadius = NaN;
    this.cylinderAxis = "y";
    this.margin = 0.01;
    this.offset = new Vector3(0, 0, 0);
    this.orientation = new Quaternion();
    this.heightfieldData = [];
    this.heightfieldDistance = 1;
    this.includeInvisible = false;
    this.uuid = null;
    this.bodyUuid = null;
  }
}
