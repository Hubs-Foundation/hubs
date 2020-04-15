import { Component } from "../Component";

export class InteractableComponent extends Component {
  static schema = {
    held: { type: Boolean, default: false },
    hovered: { type: Boolean, default: false }
  };
}

export class NetworkedComponent extends Component {
  static schema = {
    id: { type: Number, default: 0 },
    owner: { type: String, default: null },
    data: { type: JSON, default: {} }
  };
}
