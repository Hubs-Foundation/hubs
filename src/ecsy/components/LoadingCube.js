import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class LoadingCube extends Component {
  static schema = {
    value: { type: PropTypes.Object }
  };
}
