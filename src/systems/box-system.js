import { ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DELETE } from "./networked-entities-system";
import { OWNERSHIP_CHANGE } from "./owned-entities";
import { ownedEntities, meshes } from "./data";
import { bus } from "./bus";

export class BoxSystem {
  constructor() {
    this.messages = [];
    const [onCreate, onUpdate, onDelete, onOwnershipChange] = bus(this.messages, [
      ENTITY_CREATE,
      ENTITY_UPDATE,
      ENTITY_DELETE,
      OWNERSHIP_CHANGE
    ]);
    ownedEntities.subscribe(payload => payload.isBox, onCreate, onUpdate, onDelete, onOwnershipChange);
  }

  tick() {
    this.messages.forEach(([event, payload]) => {
      switch (event) {
        case ENTITY_CREATE:
          this.createBox(payload);
          break;
        case ENTITY_UPDATE:
          this.updateBox(payload);
          break;
        case ENTITY_DELETE:
          this.deleteBox(payload);
          break;
      }
    });
    this.messages.length = 0;
  }

  createBox(payload) {
    console.log("creating box...");
    console.log(payload);
    const { entityId } = payload;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    meshes.set(entityId, mesh);
    AFRAME.scenes[0].object3D.add(mesh);
    if (payload.position) {
      mesh.position.copy(payload.position);
      mesh.matrixNeedsUpdate = true;
    }
  }

  updateBox(payload) {
    const { entityId } = payload;
    const mesh = meshes.get(entityId);
    console.log(payload);
    if (payload.position) {
      mesh.position.copy(payload.position);
      mesh.matrixNeedsUpdate = true;
    }
  }

  deleteBox({ entityId }) {
    const mesh = meshes.get(entityId);
    meshes.delete(entityId);
    mesh.parent.remove(mesh);
  }
}
