import { System } from "ecsy";
import { Object3DComponent } from "ecsy-three";
import { PhysicsBody, TYPE, ACTIVATION_STATE } from "../components/PhysicsBody";
import { PhysicsShape } from "../components/PhysicsShape";
import { FIT } from "three-to-ammo";
import { PhysicsConstraint } from "../components/PhysicsConstraint";

function getBodyEntityInAncestors(entity) {
  let curObj = entity.getComponent(Object3DComponent).value;

  while (curObj) {
    if (curObj.entity && curObj.entity.hasComponent(PhysicsBody)) {
      return curObj.entity;
    }

    curObj = curObj.parent;
  }

  return null;
}

export class PhysicsSystem extends System {
  static queries = {
    physicsBodies: {
      components: [Object3DComponent, PhysicsBody],
      listen: {
        removed: true
      }
    },
    physicsShapes: {
      components: [Object3DComponent, PhysicsShape],
      listen: {
        added: true,
        removed: true
      }
    },
    physicsConstraints: {
      components: [Object3DComponent, PhysicsConstraint],
      listen: {
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
      const obj = entity.getComponent(Object3DComponent).value;
      const body = entity.getComponent(PhysicsBody);

      if (body.uuid == null) {
        obj.updateMatrices();
        const uuid = this.hubsSystem.addBody(obj, body);
        body.uuid = uuid;
        body.needsUpdate = false;
      } else if (body.needsUpdate) {
        obj.updateMatrices();
        this.hubsSystem.updateBody(body.uuid, body);
        body.needsUpdate = false;
      }

      const data = this.hubsSystem.bodyUuidToData.get(body.uuid);

      if (data) {
        body.collisions = data.collisions;
        body.linearVelocity = data.linearVelocity;
        body.angularVelocity = data.angularVelocity;
        body.index = data.index;
        body.shapes = data.shapes;
      }
    }

    const shapes = this.queries.physicsShapes.results;

    for (let i = 0; i < shapes.length; i++) {
      const entity = shapes[i];
      const obj = entity.getComponent(Object3DComponent).value;
      const shape = entity.getComponent(PhysicsShape);

      if (shape.uuid == null) {
        const bodyEntity = getBodyEntityInAncestors(entity);

        if (!bodyEntity) {
          continue;
        }

        const body = bodyEntity.getComponent(PhysicsBody);

        if (body.uuid != null) {
          if (shape.fit === FIT.ALL) {
            if (obj.isMesh) {
              obj.updateMatrices();
            } else {
              console.error("Cannot use FIT.ALL when the entity's object3D is not a mesh.");
            }
          }

          obj.updateMatrixWorld(true);
          const uuid = this.hubsSystem.addShapes(body.uuid, obj, shape);
          shape.bodyUuid = body.uuid;
          shape.uuid = uuid;
        }
      }
    }

    const constraints = this.queries.physicsConstraints.results;

    for (let i = 0; i < constraints.length; i++) {
      const entity = constraints[i];
      const constraint = entity.getComponent(PhysicsConstraint);

      if (constraint.uuid == null) {
        const body = entity.getComponent(PhysicsBody);

        let targetBody;

        if (constraint.target) {
          targetBody = constraint.target.getComponent(PhysicsBody);
        }

        if (body && targetBody && body.uuid != null && targetBody.uuid != null) {
          body.type = TYPE.DYNAMIC;
          body.activationState = ACTIVATION_STATE.DISABLE_DEACTIVATION;
          this.hubsSystem.updateBody(body.uuid, body);
          body.needsUpdate = false;
          this.hubsSystem.addConstraint(entity.id, body.uuid, targetBody.uuid, {});
          constraint.uuid = entity.id;
        }
      }
    }

    const removedConstraints = this.queries.physicsConstraints.removed;

    for (let i = 0; i < removedConstraints.length; i++) {
      const entity = removedConstraints[i];
      const constraint = entity.getRemovedComponent(PhysicsConstraint);

      if (constraint.uuid != null) {
        this.hubsSystem.removeConstraint(constraint.uuid);
      }
    }

    const removedShapes = this.queries.physicsShapes.removed;

    for (let i = 0; i < removedShapes.length; i++) {
      const entity = removedShapes[i];
      const shape = entity.getRemovedComponent(PhysicsShape);

      if (shape.uuid != null) {
        this.hubsSystem.removeShapes(shape.bodyUuid, shape.uuid);
      }
    }

    const removedBodies = this.queries.physicsBodies.removed;

    for (let i = 0; i < removedBodies.length; i++) {
      const entity = removedBodies[i];
      const body = entity.getRemovedComponent(PhysicsBody);

      if (body.uuid != null) {
        this.hubsSystem.removeBody(body.uuid);
      }
    }
  }
}
