import { Types, Component } from "ecsy";

export const GLTFAnimations = {
  Loop: "loop"
};

export class GLTFLoader extends Component {
  static schema = {
    src: { type: Types.String },
    playAnimations: { type: Types.String, default: null }
  };
}
