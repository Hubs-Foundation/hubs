import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class AFrameEntity extends Component {
  static schema = {
    value: { type: PropTypes.Object }
  };
}
