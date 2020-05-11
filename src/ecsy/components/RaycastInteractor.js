import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class RaycastInteractor extends Component {
  static schema = {
    targets: { type: PropTypes.Array },
    intersections: { type: PropTypes.Array }
  };
}
