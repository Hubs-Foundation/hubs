import { Component } from "ecsy";

export class AFrameEntity extends Component {
  constructor() {
    super();
    this.value = null;
  }

  reset() {
    this.value = null;
  }
}
