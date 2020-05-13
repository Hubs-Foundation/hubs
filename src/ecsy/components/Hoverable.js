import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Hoverable extends Component {
  static schema = {
    hand: { type: PropTypes.Boolean, default: true },
    remote: { type: PropTypes.Boolean, default: true }
  };
}
