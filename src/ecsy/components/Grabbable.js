import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Grabbable extends Component {
  static schema = {
    throwable: { type: PropTypes.Boolean }, // Copy the velocity to the entity on drop
    toggle: { type: PropTypes.Boolean }, // Whether the object should stay grabbed until the grab action is true again
    grabStarted: { type: PropTypes.Boolean },
    grabbing: { type: PropTypes.Boolean },
    grabEnded: { type: PropTypes.Boolean }
  };
}
