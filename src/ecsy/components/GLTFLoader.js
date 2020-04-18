import { Component } from "ecsy";

export const GLTFAnimations = {
  Loop: "loop"
};

export class GLTFLoader extends Component {
  constructor() {
    super();
    this.src = "";
    this.playAnimations = null;
  }

  reset() {
    this.src = "";
    this.playAnimations = null;
  }
}
