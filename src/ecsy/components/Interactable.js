import { Component } from "ecsy";

export class Interactable extends Component {
  constructor() {
    super();
    this.held = false;
    this.hovered = false;
  }

  reset() {
    this.held = false;
    this.hovered = false;
  }
}
