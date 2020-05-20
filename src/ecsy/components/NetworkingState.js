import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

export class NetworkingState extends Component {
  static schema = {
    lastUpdate: { type: PropTypes.Number },
    entities: { type: PropTypes.Object, default: {} },
    templates: { type: PropTypes.Object, default: {} },
    lastSentData: { type: PropTypes.Object, default: {} }
  };

  registerTemplate(Template) {
    this.templates[Template.id] = new Template();
  }

  unregisterTemplate(Template) {
    delete this.templates[Template.id];
  }

  createEntity(world, Template) {
    return this.templates[Template.id].createEntity(world);
  }
}
