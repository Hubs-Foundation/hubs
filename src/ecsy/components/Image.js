import { Component } from "ecsy";

export class Image extends Component {
  constructor() {
    super();
    this.src = "";
    this.contentType = null;
  }

  reset() {
    this.src = "";
    this.contentType = null;
  }
}
