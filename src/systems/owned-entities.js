import { ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DELETE } from "./networked-entities-system";
import { ownership, networkedEntities } from "./data";
import { emitter } from "../emitter";
import { bus } from "./bus";
export const OWNERSHIP_CHANGE = "ownership-change";
export class OwnedEntities {
  constructor() {
    this.messages = [];
    this.events = new emitter();
    const [onUpdate, onDelete] = bus(this.messages, [ENTITY_UPDATE, ENTITY_DELETE]);
    networkedEntities.subscribe(
      payload => payload.hasOwner,
      payload => {
        console.log("created...");
        this.createOwnedEntity(payload);
      },
      onUpdate,
      onDelete
    );
  }

  subscribe(predicate, onCreate, onUpdate, onDelete, onOwnershipChange) {
    this.events.on(ENTITY_CREATE, payload => {
      if (predicate(payload)) {
        this.events.on(`${ENTITY_UPDATE}:${payload.entityId}`, onUpdate);
        this.events.on(`${ENTITY_DELETE}:${payload.entityId}`, onDelete);
        this.events.on(`${OWNERSHIP_CHANGE}:${payload.entityId}`, onOwnershipChange);
        onCreate(payload);
      }
    });
  }

  tick() {
    this.messages.forEach(([event, payload]) => {
      switch (event) {
        case ENTITY_UPDATE:
          this.updateOwnedEntity(payload);
      }
    });
    this.messages.length = 0;
  }

  createOwnedEntity(payload) {
    const { entityId, ownerId, ownerTime } = payload;
    ownership.set(entityId, { ownerId, ownerTime });
    console.log("trigger entity create (owned)");
    this.events.trigger(ENTITY_CREATE, payload);
  }

  updateOwnedEntity(payload) {
    if (payload.senderId !== ownership.get(payload.entityId).ownerId) {
      this.maybeChangeOwnership(payload);
    }
    if (payload.senderId === ownership.get(payload.entityId).ownerId) {
      this.events.trigger(`${ENTITY_UPDATE}:${payload.entityId}`, payload);
    }
  }
  maybeChangeOwnership(payload) {
    const { entityId } = payload;
    const { ownerId, ownerTime } = ownership.get(entityId);
    if (ownerId !== payload.ownerId && payload.ownerTime > ownerTime) {
      ownership.set(entityId, { ownerId: payload.ownerId, ownerTime: payload.ownerTime });
      this.events.trigger(`${OWNERSHIP_CHANGE}:${entityId}`, {
        prevOwnerId: ownerId,
        ownerId: payload.ownerId
      });
    }
  }
}
