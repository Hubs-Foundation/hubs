import { System } from "ecsy";
import { Object3D, Parent } from "ecsy-three";
import { PhysicsBody } from "../components/PhysicsBody";
import { PhysicsShape } from "../components/PhysicsShape";
import { FIT } from "three-to-ammo";
import { AFrameEntity } from "../components/AFrameEntity";

function getBodyEntityInAncestors(entity) {
  let curEntity = entity;

  while (curEntity) {
    if (curEntity.hasComponent(PhysicsBody)) {
      return curEntity;
    }

    const parent = curEntity.getComponent(Parent);

    if (parent) {
      curEntity = parent.value;
    } else {
      curEntity = null;
    }
  }

  return null;
}

export class PhysicsSystem extends System {
  static queries = {
    physicsBodies: {
      components: [Object3D, PhysicsBody],
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
      const object = entity.getComponent(Object3D).value;

      if (body.uuid == null) {
        if (entity.hasComponent(AFrameEntity)) {
          // TODO: Remove this branch.
          const aframeEntity = entity.getComponent(AFrameEntity).value;
          const bodyHelper = aframeEntity.components["body-helper"];

          if (bodyHelper) {
            body.uuid = bodyHelper.uuid;
            body.needsUpdate = false;
          }
        } else {
          object.updateMatrices();
          const uuid = this.hubsSystem.addBody(object, body);
          body.uuid = uuid;
          body.needsUpdate = false;
        }
      } else if (body.needsUpdate) {
        object.updateMatrices();
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
      const object = entity.getComponent(Object3D).value;

      if (shape.uuid == null) {
        const bodyEntity = getBodyEntityInAncestors(entity);
        const body = bodyEntity.getComponent(PhysicsBody);

        if (body.uuid !== undefined) {
          if (shape.fit === FIT.ALL) {
            if (object.isMesh) {
              object.updateMatrices();
            } else {
              console.error("Cannot use FIT.ALL when the entity's object3D is not a mesh.");
            }
          }

          object.updateMatrixWorld(true);
          const uuid = this.hubsSystem.addShapes(body.uuid, object, shape);
          shape.bodyUuid = body.uuid;
          shape.uuid = uuid;
          console.log("add shape", body.uuid, object, shape, uuid, this.hubsSystem.bodyUuidToData.get(body.uuid));
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
