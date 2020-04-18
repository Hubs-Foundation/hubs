import { Component } from "ecsy";

export class Animation extends Component {
  constructor() {
    super();
    this.animations = [];
    this.mixer = null;
  }

  reset() {
    this.animations = [];
    this.mixer = null;
  }
}
