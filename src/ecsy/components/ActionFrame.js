import { Component } from "ecsy";

export class ActionFrame extends Component {
  constructor() {
    super();
    this.value = null;
  }

  reset() {
    this.value = null;
  }
}
