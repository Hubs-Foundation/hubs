import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Interactor extends Component {
  static schema = {
    id: { type: PropTypes.String }
  };
}
