import { Component } from "ecsy";

export class PhysicsBody extends Component {
  constructor() {
    super();
    this.value = null;
  }

  reset() {
    this.value = null;
  }
}
