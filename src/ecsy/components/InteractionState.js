import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class InteractionState extends Component {
  static schema = {
    leftHand: { type: PropTypes.Object },
    rightHand: { type: PropTypes.Object },
    leftRemote: { type: PropTypes.Object },
    rightRemote: { type: PropTypes.Object }
  };
}
