import { Types, Component } from "ecsy";

export class Animation extends Component {
  static schema = {
    animations: { type: Types.Array },
    mixer: { type: Types.Object }
  };
}
