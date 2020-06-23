import { Types, Component } from "ecsy";

export class PhysicsConstraint extends Component {
  static schema = {
    uuid: { type: Types.String, default: null },
    target: { type: Types.Object }
  };
}
