import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity, TextTag } from "../bit-components";
import { getShapeFromPhysicsShape } from "../inflators/physics-shape";
import { findAncestorWithComponent, hasAnyComponent } from "../utils/bit-utils";
import { getBodyFromRigidBody } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";
import { EntityID } from "../utils/networking-types";
import { Object3D } from "three";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeQuery = defineQuery([PhysicsShape]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);

// We don't want to add physics shape for some child entities
// ie.  If the object already has a physics shape we don't want to create another one.
//      If the object has a text component, we don't want to create a physics shape for it.
const NO_PHYSICS_COMPONENTS = [Rigidbody, TextTag];

function addPhysicsShapes(world: HubsWorld, physicsSystem: PhysicsSystem, eid: number) {
  const bodyId = PhysicsShape.bodyId[eid];
  const obj = world.eid2obj.get(eid)!;

  // Avoid adding physics shapes for child entities with specific components.
  if (obj) {
    const hidden = new Map<EntityID, EntityID>();
    obj.traverse((child: Object3D) => {
      if (child.eid! !== eid && hasAnyComponent(world, NO_PHYSICS_COMPONENTS, child.eid!)) {
        hidden.set(child.eid!, child.parent!.eid!);
      }
    });
    for (let child of hidden.keys()) {
      const childObj = world.eid2obj.get(child)!;
      childObj.removeFromParent();
    }

    const shape = getShapeFromPhysicsShape(eid);
    const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    PhysicsShape.shapeId[eid] = shapeId;

    hidden.forEach((parent: EntityID, child: EntityID) => {
      const parentObj = world.eid2obj.get(parent)!;
      const childObj = world.eid2obj.get(child)!;
      parentObj.add(childObj);
    });
  }
}

export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach((eid: EntityID) => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
  });

  shapeEnterQuery(world).forEach((eid: EntityID) => {
    const bodyEid = findAncestorWithComponent(world, Rigidbody, eid);
    if (bodyEid) {
      PhysicsShape.bodyId[eid] = Rigidbody.bodyId[bodyEid];
      addPhysicsShapes(world, physicsSystem, eid);
    } else {
      console.warn(`Could find a body for shape in entity ${eid}`);
    }
  });

  shapeExitQuery(world).forEach((eid: EntityID) =>
    physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid])
  );

  rigidbodyExitedQuery(world).forEach((eid: EntityID) => {
    if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
      // The PhysicsShape is still on this entity!
    }
    physicsSystem.removeBody(Rigidbody.bodyId[eid]);
  });
};
