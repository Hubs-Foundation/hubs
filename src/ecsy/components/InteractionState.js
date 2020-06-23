import { Types, Component } from "ecsy";

export class InteractionState extends Component {
  static schema = {
    leftHand: { type: Types.Object },
    rightHand: { type: Types.Object },
    leftRemote: { type: Types.Object },
    rightRemote: { type: Types.Object }
  };
}
