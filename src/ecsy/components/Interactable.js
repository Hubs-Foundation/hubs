import { Component } from "ecsy";

export class Interactable extends Component {
  constructor() {
    super();
    this.hoverStarted = false;
    this.hovering = false;
    this.hoverEnded = false;
  }

  reset() {
    this.hoverStarted = false;
    this.hovering = false;
    this.hoverEnded = false;
  }
}
