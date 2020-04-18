import { Component } from "ecsy";

export class MediaLoader extends Component {
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
