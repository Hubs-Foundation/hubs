import { Types, Component } from "ecsy";

export class Networked extends Component {
  static schema = {
    networkId: { type: Types.String },
    owner: { type: Types.String },
    creator: { type: Types.String },
    template: { type: Types.Object },
    attachTemplateToLocal: { type: Types.Boolean, default: true },
    persistent: { type: Types.Boolean }
  };
}
