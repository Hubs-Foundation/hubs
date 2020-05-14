import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class PhysicsConstraint extends Component {
  static schema = {
    uuid: { type: PropTypes.String, default: null },
    target: { type: PropTypes.Object }
  };
}
