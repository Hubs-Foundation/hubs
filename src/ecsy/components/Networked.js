import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class Networked extends Component {
  static schema = {
    networkId: { type: PropTypes.String },
    owner: { type: PropTypes.String },
    creator: { type: PropTypes.String },
    template: { type: PropTypes.Object },
    attachTemplateToLocal: { type: PropTypes.Boolean, default: true },
    persistent: { type: PropTypes.Boolean }
  };
}
