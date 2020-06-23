import { Component } from "ecsy";
import { Types } from "ecsy";

export class MediaLoader extends Component {
  static schema = {
    src: { type: Types.String },
    contentType: { type: Types.String, default: null }
  };
}
