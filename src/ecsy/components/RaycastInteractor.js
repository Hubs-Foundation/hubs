import { Component } from "ecsy";

export class RaycastInteractor extends Component {
  constructor() {
    super();
    this.targets = [];
    this.intersections = [];
  }

  reset() {
    this.targets.length = 0;
    this.intersections.length = 0;
  }
}
