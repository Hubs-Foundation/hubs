import { Types, Component } from "ecsy";
import { ThreeTypes } from "ecsy-three";
import { Vector3, Vector4 } from "three";
import { SHAPE, FIT } from "three-ammo/constants";

export class PhysicsShape extends Component {
  static schema = {
    type: { type: Types.String, default: SHAPE.BOX },
    fit: { type: Types.String, default: FIT.ALL },
    halfExtents: { type: ThreeTypes.Vector3Type, default: new Vector3(1, 1, 1) },
    minHalfExtent: { type: Types.Number, default: 0.04 },
    maxHalfExtent: { type: Types.Number, default: Number.POSITIVE_INFINITY },
    sphereRadius: { type: Types.Number, default: NaN }, // TODO: Ah yes, my favorite number: NaN
    cylinderAxis: { type: Types.String, default: "y" },
    margin: { type: Types.Number, default: 0.01 },
    offset: { type: ThreeTypes.Vector3Type, default: new Vector3(0, 0, 0) },
    orientation: { type: ThreeTypes.Vector4Type, default: new Vector4() },
    heightfieldData: { type: Types.Array, default: [] },
    heightfieldDistance: { type: Types.Number, default: 1 },
    includeInvisible: { type: Types.Boolean, default: false },
    uuid: { type: Types.String, default: null },
    bodyUuid: { type: Types.String, default: null }
  };
}
