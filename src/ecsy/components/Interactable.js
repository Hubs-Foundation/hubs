import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Interactable extends Component {
  static schema = {
    hoverStarted: { type: PropTypes.Boolean },
    hovering: { type: PropTypes.Boolean },
    hoverEnded: { type: PropTypes.Boolean }
  };
}
