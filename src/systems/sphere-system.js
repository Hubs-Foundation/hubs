import { ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DELETE } from "./networked-entities-system";
import { OWNERSHIP_CHANGE } from "./owned-entities";
import { ownedEntities, meshes } from "./data";
import { bus } from "./bus";

export class SphereSystem {
  constructor() {
    this.messages = [];
    const [onCreate, onUpdate, onDelete, onOwnershipChange] = bus(this.messages, [
      ENTITY_CREATE,
      ENTITY_UPDATE,
      ENTITY_DELETE,
      OWNERSHIP_CHANGE
    ]);
    ownedEntities.subscribe(payload => payload.isSphere, onCreate, onUpdate, onDelete, onOwnershipChange);
  }

  tick() {
    this.messages.forEach(([event, payload]) => {
      switch (event) {
        case ENTITY_CREATE:
          this.createSphere(payload);
          break;
        case ENTITY_UPDATE:
          this.updateSphere(payload);
          break;
        case ENTITY_DELETE:
          this.deleteSphere(payload);
          break;
      }
    });
    this.messages.length = 0;
  }

  createSphere(payload) {
    const { entityId } = payload;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial());
    meshes.set(entityId, mesh);
    AFRAME.scenes[0].object3D.add(mesh);
    if (payload.position) {
      mesh.position.copy(payload.position);
      mesh.matrixNeedsUpdate = true;
    }
  }

  updateSphere(payload) {
    const { entityId } = payload;
    const mesh = meshes.get(entityId);
    if (payload.position) {
      mesh.position.copy(payload.position);
      mesh.matrixNeedsUpdate = true;
    }
  }

  deleteSphere({ entityId }) {
    const mesh = meshes.get(entityId);
    meshes.delete(entityId);
    mesh.parent.remove(mesh);
  }
}
