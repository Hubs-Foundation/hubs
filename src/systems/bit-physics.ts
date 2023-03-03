import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity, MediaLoader, MediaLoaded } from "../bit-components";
import { Fit, getShapeFromPhysicsShape, PhysicsShapes, Shape } from "../inflators/physics-shape";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { contentTypeForMediaInfo, MediaLoadedInfo, MediaTypeE } from "../bit-systems/media-loading";
import { Mesh } from "three";
import { getBodyFromRigidBody } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeQuery = defineQuery([PhysicsShape]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);
const mediaLoaderQuery = defineQuery([MediaLoader]);
const exitMediaLoaderQuery = exitQuery(mediaLoaderQuery);

const media = new Set<number>();

function addPhysicsShapes(world: HubsWorld, physicsSystem: PhysicsSystem, shapeEid: number, objEid: number) {
  const bodyId = PhysicsShape.bodyId[shapeEid];
  const shapeIds = PhysicsShapes.get(shapeEid)!;
  const obj = world.eid2obj.get(objEid)!;
  if (PhysicsShape.fit[shapeEid] === Fit.ALL) {
    let found = false;
    obj.traverse(child => {
      if (child instanceof Mesh) {
        child.updateMatrices();
        const shape = getShapeFromPhysicsShape(shapeEid);
        const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
        shapeIds.add(shapeId);
        found = true;
      }
    });
    if (!found) {
      console.error("Cannot use FIT.ALL without a mesh");
      return;
    }
  } else {
    const shape = getShapeFromPhysicsShape(shapeEid);
    const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    shapeIds.add(shapeId);
  }
}

function setupPhysicsShapeForMedia(world: HubsWorld, physicsSystem: PhysicsSystem, eid: number) {
  const mediaEid = findChildWithComponent(world, MediaLoaded, eid)!;
  const mediaInfo = MediaLoadedInfo.get(mediaEid)!;
  const mediaType = contentTypeForMediaInfo(mediaInfo);

  switch (mediaType) {
    case MediaTypeE.VIDEO:
    case MediaTypeE.IMAGE:
    case MediaTypeE.PDF:
    case MediaTypeE.HTML: {
      PhysicsShape.shape[eid] = Shape.BOX;
      break;
    }
    case MediaTypeE.GLTF: {
      PhysicsShape.shape[eid] = Shape.HULL;
      break;
    }
  }

  // TODO update scale?
  PhysicsShape.minHalfExtent[eid] = 0.04;

  addPhysicsShapes(world, physicsSystem, eid, mediaEid);
}

export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
  });

  shapeEnterQuery(world).forEach(eid => {
    const bodyId = Rigidbody.bodyId[eid];
    if (bodyId) {
      PhysicsShape.bodyId[eid] = bodyId;
    } else {
      const bodyEid = findAncestorWithComponent(world, Rigidbody, eid);
      bodyEid && (PhysicsShape.bodyId[eid] = Rigidbody.bodyId[bodyEid]);
    }
    PhysicsShape.bodyId[eid] && addPhysicsShapes(world, physicsSystem, eid, eid);
  });

  exitMediaLoaderQuery(world).forEach(eid => setupPhysicsShapeForMedia(world, physicsSystem, eid));

  shapeExitQuery(world).forEach(eid => {
    const shapeIds = PhysicsShapes.get(eid)!;
    shapeIds.forEach(shapeId => {
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], shapeId);
      shapeIds.delete(shapeId);
    });
  });

  rigidbodyExitedQuery(world).forEach(eid => {
    if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
      const shapeIds = PhysicsShapes.get(eid)!;
      shapeIds.forEach(shapeId => {
        physicsSystem.removeShapes(PhysicsShape.bodyId[eid], shapeId);
        shapeIds.delete(shapeId);
      });
      // The PhysicsShape is still on this entity!
    }
    physicsSystem.removeBody(Rigidbody.bodyId[eid]);
  });
};
