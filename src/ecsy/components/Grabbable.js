import { Component } from "ecsy";

export class Grabbable extends Component {
  constructor() {
    super();
    this.throwable = true; // Copy the velocity to the entity on drop
    this.toggle = false; // Whether the object should stay grabbed until the grab action is true again
    this.grabStarted = false;
    this.grabbing = false;
    this.grabEnded = false;
  }

  reset() {
    this.throwable = true;
    this.toggle = false;
    this.grabStarted = false;
    this.grabbing = false;
    this.grabEnded = false;
  }
}
