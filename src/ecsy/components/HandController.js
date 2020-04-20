import { Component } from "ecsy";

export class HandController extends Component {
  constructor() {
    super();
    this.id = null;
  }

  reset() {
    this.id = null;
  }
}
