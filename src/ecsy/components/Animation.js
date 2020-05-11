import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Animation extends Component {
  static schema = {
    animations: { type: PropTypes.Array },
    mixer: { type: PropTypes.Object }
  };
}
