import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";
import { Vector3, Quaternion } from "three";
import { SHAPE, FIT } from "three-ammo/constants";

export class PhysicsShape extends Component {
  static schema = {
    type: { type: PropTypes.String, default: SHAPE.BOX },
    fit: { type: PropTypes.String, default: FIT.ALL },
    halfExtents: { type: PropTypes.Vector3, default: new Vector3(1, 1, 1) },
    minHalfExtent: { type: PropTypes.Number, default: 0.04 },
    maxHalfExtent: { type: PropTypes.Number, default: Number.POSITIVE_INFINITY },
    sphereRadius: { type: PropTypes.Number, default: NaN }, // TODO: Ah yes, my favorite number: NaN
    cylinderAxis: { type: PropTypes.String, default: "y" },
    margin: { type: PropTypes.Number, default: 0.01 },
    offset: { type: PropTypes.Vector3, default: new Vector3(0, 0, 0) },
    orientation: { type: PropTypes.Quaternion, default: new Quaternion() },
    heightfieldData: { type: PropTypes.Array, default: [] },
    heightfieldDistance: { type: PropTypes.Number, default: 1 },
    includeInvisible: { type: PropTypes.Boolean, default: false },
    uuid: { type: PropTypes.String, default: null },
    bodyUuid: { type: PropTypes.String, default: null }
  };
}
