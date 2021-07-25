import { eventNamesForRoomId } from "../utils/event-names-for-room-id";
import { emitter } from "../emitter";

export const ENTITY_CREATE = "entity-create";
export const ENTITY_UPDATE = "entity-update";
export const ENTITY_DELETE = "entity-delete";

export class NetworkedEntities {
  constructor(roomId) {
    this.events = new emitter();
    this.roomId = roomId;
    this.entities = new Set();
    this.messages = [];
    document.addEventListener("jeejah", () => {
      const jj = APP.jeejah.events;
      const { CREATE, UPDATE, DELETE } = eventNamesForRoomId(roomId);
      jj.on(CREATE, payload => {
        this.messages.push([CREATE, payload]);
      });
      jj.on(UPDATE, payload => {
        this.messages.push([UPDATE, payload]);
      });
      jj.on(DELETE, payload => {
        this.messages.push([DELETE, payload]);
      });
    });
  }

  subscribe(predicate, onCreate, onUpdate, onDelete) {
    this.events.on(ENTITY_CREATE, payload => {
      if (predicate(payload)) {
        this.events.on(`${ENTITY_UPDATE}:${payload.entityId}`, onUpdate);
        this.events.on(`${ENTITY_DELETE}:${payload.entityId}`, onDelete);
        onCreate(payload);
      }
    });
  }

  tick() {
    const { CREATE, UPDATE, DELETE } = eventNamesForRoomId(this.roomId);
    this.messages.forEach(([event, payload]) => {
      const { entityId } = payload;
      switch (event) {
        case CREATE:
          if (!this.entities.has(entityId)) {
            this.entities.add(entityId);
            this.events.trigger(ENTITY_CREATE, payload);
          }
          break;
        case UPDATE:
          if (this.entities.has(entityId)) {
            this.events.trigger(`${ENTITY_UPDATE}:${entityId}`, payload);
          }
          break;
        case DELETE:
          this.events.trigger(`${ENTITY_DELETE}:${entityId}`, payload);
          this.entities.delete(entityId);
          break;
      }
    });
    this.messages.length = 0;
  }
}
