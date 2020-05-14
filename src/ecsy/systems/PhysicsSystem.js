import { System } from "ecsy";
import { PhysicsBody } from "../components/PhysicsBody";
import { PhysicsShape } from "../components/PhysicsShape";
import { FIT } from "three-to-ammo";

function getBodyEntityInAncestors(entity) {
  let curEntity = entity;

  while (curEntity) {
    if (curEntity.isECSYThreeEntity && curEntity.hasComponent(PhysicsBody)) {
      return curEntity;
    }

    curEntity = curEntity.parent;
  }

  return null;
}

export class PhysicsSystem extends System {
  static queries = {
    physicsBodies: {
      components: [PhysicsBody],
      listen: {
        removed: true
      }
    },
    physicsShapes: {
      components: [PhysicsShape],
      listen: {
        added: true,
        removed: true
      }
    }
  };

  constructor(world, attributes) {
    super(world, attributes);
    this.hubsSystem = attributes.hubsSystem;
  }

  execute() {
    if (!this.hubsSystem.ready) {
      return;
    }

    const bodies = this.queries.physicsBodies.results;

    for (let i = 0; i < bodies.length; i++) {
      const entity = bodies[i];
      const body = entity.getComponent(PhysicsBody);

      if (body.uuid == null) {
        entity.updateMatrices();
        console.log("addBody");
        const uuid = this.hubsSystem.addBody(entity, body);
        body.uuid = uuid;
        body.needsUpdate = false;
      } else if (body.needsUpdate) {
        entity.updateMatrices();
        this.hubsSystem.updateBody(body.uuid, body);
        body.needsUpdate = false;
      }

      const data = this.hubsSystem.bodyUuidToData.get(body.uuid);

      body.collisions = data.collisions;
      body.linearVelocity = data.linearVelocity;
      body.angularVelocity = data.angularVelocity;
      body.index = data.index;
      body.shapes = data.shapes;
    }

    const shapes = this.queries.physicsShapes.results;

    for (let i = 0; i < shapes.length; i++) {
      const entity = shapes[i];
      const shape = entity.getComponent(PhysicsShape);

      if (shape.uuid == null) {
        const bodyEntity = getBodyEntityInAncestors(entity);

        if (!bodyEntity) {
          continue;
        }

        const body = bodyEntity.getComponent(PhysicsBody);

        if (body.uuid !== undefined) {
          if (shape.fit === FIT.ALL) {
            if (entity.isMesh) {
              entity.updateMatrices();
            } else {
              console.error("Cannot use FIT.ALL when the entity's object3D is not a mesh.");
            }
          }

          entity.updateMatrixWorld(true);
          console.log("addShapes");
          const uuid = this.hubsSystem.addShapes(body.uuid, entity, shape);
          shape.bodyUuid = body.uuid;
          shape.uuid = uuid;
        }
      }
    }

    const removedShapes = this.queries.physicsShapes.removed;

    for (let i = 0; i < removedShapes.length; i++) {
      const entity = removedShapes[i];
      const shape = entity.getComponent(PhysicsShape);

      if (shape.uuid != null) {
        this.hubsSystem.removeShapes(shape.bodyUuid, shape.uuid);
      }
    }

    const removed = this.queries.physicsBodies.removed;

    for (let i = 0; i < removed.length; i++) {
      const entity = removed[i];
      const body = entity.getComponent(PhysicsBody);

      if (body.uuid != null) {
        this.hubsSystem.removeBody(body.uuid);
      }
    }
  }
}
