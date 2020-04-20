import { Component } from "ecsy";

export class CursorController extends Component {
  constructor() {
    super();
    this.id = null;
  }

  reset() {
    this.id = null;
  }
}
