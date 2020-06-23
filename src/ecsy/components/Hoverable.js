import { Types, Component } from "ecsy";

export class Hoverable extends Component {
  static schema = {
    hand: { type: Types.Boolean, default: true },
    remote: { type: Types.Boolean, default: true }
  };
}
