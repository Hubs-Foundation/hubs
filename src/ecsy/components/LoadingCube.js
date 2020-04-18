import { Component } from "ecsy";

export class LoadingCube extends Component {
  constructor() {
    super();
    this.value = null;
  }

  reset() {
    this.value = null;
  }
}
