import { Types, Component } from "ecsy";

export class NetworkingState extends Component {
  static schema = {
    lastUpdate: { type: Types.Number },
    entities: { type: Types.Object, default: {} },
    templates: { type: Types.Object, default: {} },
    lastSentData: { type: Types.Object, default: {} }
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
