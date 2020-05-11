import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class MediaLoader extends Component {
  static schema = {
    src: { type: PropTypes.String },
    contentType: { type: PropTypes.String, default: null }
  };
}
