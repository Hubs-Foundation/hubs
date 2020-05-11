import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Image extends Component {
  static schema = {
    src: { type: PropTypes.String },
    contentType: { type: PropTypes.String, default: null }
  };
}
