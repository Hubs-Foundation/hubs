import { System } from "ecsy";
import { ParentObject3D, Transform, Position, Scale, Parent, Object3D } from "ecsy-three";

// Modified from ecsy-three. Sets `matrixNeedsUpdate = true` after transforms are changed.
export class HubsTransformSystem extends System {
  static queries = {
    parentObject3D: {
      components: [ParentObject3D, Object3D],
      listen: {
        added: true
      }
    },
    parent: {
      components: [Parent, Object3D],
      listen: {
        added: true
      }
    },
    transforms: {
      components: [Object3D, Transform],
      listen: {
        added: true,
        changed: [Transform]
      }
    },
    positions: {
      components: [Object3D, Position],
      listen: {
        added: true,
        changed: [Position]
      }
    },
    scales: {
      components: [Object3D, Scale],
      listen: {
        added: true,
        changed: [Scale]
      }
    }
  };

  execute() {
    // Hierarchy
    const added = this.queries.parent.added;
    for (let i = 0; i < added.length; i++) {
      const entity = added[i];
      const parentEntity = entity.getComponent(Parent).value;
      if (parentEntity.hasComponent(Object3D)) {
        const parentObject3D = parentEntity.getComponent(Object3D).value;
        const childObject3D = entity.getComponent(Object3D).value;
        parentObject3D.add(childObject3D);
      }
    }

    // Hierarchy
    this.queries.parentObject3D.added.forEach(entity => {
      const parentObject3D = entity.getComponent(ParentObject3D).value;
      const childObject3D = entity.getComponent(Object3D).value;
      parentObject3D.add(childObject3D);
    });

    // Transforms
    const transforms = this.queries.transforms;
    for (let i = 0; i < transforms.added.length; i++) {
      const entity = transforms.added[i];
      const transform = entity.getComponent(Transform);
      const object = entity.getComponent(Object3D).value;

      object.position.copy(transform.position);
      object.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
      object.matrixNeedsUpdate = true;
    }

    for (let i = 0; i < transforms.changed.length; i++) {
      const entity = transforms.changed[i];
      const transform = entity.getComponent(Transform);
      const object = entity.getComponent(Object3D).value;

      object.position.copy(transform.position);
      object.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
      object.matrixNeedsUpdate = true;
    }

    // Position
    const positions = this.queries.positions;
    for (let i = 0; i < positions.added.length; i++) {
      const entity = positions.added[i];
      const position = entity.getComponent(Position).value;

      const object = entity.getComponent(Object3D).value;

      object.position.copy(position);
      object.matrixNeedsUpdate = true;
    }

    for (let i = 0; i < positions.changed.length; i++) {
      const entity = positions.changed[i];
      const position = entity.getComponent(Position).value;
      const object = entity.getComponent(Object3D).value;

      object.position.copy(position);
      object.matrixNeedsUpdate = true;
    }

    // Scale
    const scales = this.queries.scales;
    for (let i = 0; i < scales.added.length; i++) {
      const entity = scales.added[i];
      const scale = entity.getComponent(Scale).value;

      const object = entity.getComponent(Object3D).value;

      object.scale.copy(scale);
      object.matrixNeedsUpdate = true;
    }

    for (let i = 0; i < scales.changed.length; i++) {
      const entity = scales.changed[i];
      const scale = entity.getComponent(Scale).value;
      const object = entity.getComponent(Object3D).value;

      object.scale.copy(scale);
      object.matrixNeedsUpdate = true;
    }
  }
}
