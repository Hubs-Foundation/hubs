import { ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DELETE } from "./networked-entities-system";
import { meshes, networkedEntities } from "./data";
import { bus } from "./bus";

export class ColorSystem {
  constructor() {
    this.messages = [];
    const [onCreate, onUpdate, onDelete] = bus(this.messages, [ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DELETE]);
    networkedEntities.subscribe(payload => payload.hasOwner, onCreate, onUpdate, onDelete);
  }

  tick() {
    this.messages.forEach(([event, payload]) => {
      console.log(event, payload);
      switch (event) {
        case ENTITY_CREATE:
          this.setColor(payload);
          break;
        case ENTITY_UPDATE:
          this.setColor(payload);
          break;
        case ENTITY_DELETE:
          break;
      }
    });
    this.messages.length = 0;
  }

  setColor(payload) {
    const { entityId } = payload;
    const mesh = meshes.get(entityId);
    if (payload.color) {
      mesh.material.color.set(payload.color);
      mesh.material.needsUpdate = true;
    }
  }
}
