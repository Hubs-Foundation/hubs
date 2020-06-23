import { Types, Component } from "ecsy";

export class Image extends Component {
  static schema = {
    src: { type: Types.String },
    contentType: { type: Types.String, default: null }
  };
}
