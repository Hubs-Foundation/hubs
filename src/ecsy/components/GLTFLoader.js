import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export const GLTFAnimations = {
  Loop: "loop"
};

export class GLTFLoader extends Component {
  static schema = {
    src: { type: PropTypes.String },
    playAnimations: { type: PropTypes.String, default: null }
  };
}
