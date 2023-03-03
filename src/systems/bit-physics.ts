import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity, MediaLoader, MediaLoaded } from "../bit-components";
import { Fit, getShapeFromPhysicsShape, Shape } from "../inflators/physics-shape";
import { findChildWithComponent } from "../utils/bit-utils";
import { contentTypeForMediaInfo, MediaLoadedInfo, MediaTypeE } from "../bit-systems/media-loading";
import { Mesh } from "three";
import { getBodyFromRigidBody } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeQuery = defineQuery([Rigidbody, PhysicsShape]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);
const mediaLoaderQuery = defineQuery([MediaLoader]);
const enterMediaLoaderQuery = enterQuery(mediaLoaderQuery);
const exitMediaLoaderQuery = exitQuery(mediaLoaderQuery);

const media = new Set<number>();

export const RIGIDBODY_FLAGS = {
  DISABLE_COLLISIONS: 1 << 0
};

function updatePhysicsShape(world: HubsWorld, physicsSystem: PhysicsSystem, shapeEid: number, objEid: number) {
  const bodyId = Rigidbody.bodyId[shapeEid];
  let shapeId = PhysicsShape.shapeId[shapeEid];
  bodyId && shapeId && physicsSystem.removeShapes(bodyId, shapeId);
  const obj = world.eid2obj.get(objEid)!;
  if (PhysicsShape.fit[shapeEid] === Fit.ALL) {
    // TODO Support for multiple shapes
    let found = false;
    obj.traverse(child => {
      if (!found && child instanceof Mesh) {
        child.updateMatrices();
        const shape = getShapeFromPhysicsShape(shapeEid);
        shapeId = physicsSystem.addShapes(bodyId, obj, shape);
        PhysicsShape.shapeId[shapeEid] = shapeId;
        found = true;
      }
    });
    if (!found) {
      console.error("Cannot use FIT.ALL without a mesh");
      return;
    }
  } else {
    const shape = getShapeFromPhysicsShape(shapeEid);
    shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    PhysicsShape.shapeId[shapeEid] = shapeId;
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
      PhysicsShape.type[eid] = Shape.BOX;
      break;
    }
    case MediaTypeE.GLTF: {
      PhysicsShape.type[eid] = Shape.HULL;
      break;
    }
  }

  // TODO update scale?
  PhysicsShape.minHalfExtent[eid] = 0.04;

  updatePhysicsShape(world, physicsSystem, eid, mediaEid);
}

export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
  });

  shapeEnterQuery(world).forEach(eid => {
    if (hasComponent(world, Rigidbody, eid)) {
      const bodyId = Rigidbody.bodyId[eid];
      // TODO If not physics body. Look up the graph for one and use that
      PhysicsShape.bodyId[eid] = bodyId;
      updatePhysicsShape(world, physicsSystem, eid, eid);
    }
  });

  enterMediaLoaderQuery(world).forEach(eid => {
    if (hasComponent(world, PhysicsShape, eid)) {
      media.add(eid);
    }
  });

  exitMediaLoaderQuery(world).forEach(eid => {
    if (media.has(eid)) {
      setupPhysicsShapeForMedia(world, physicsSystem, eid);
      media.delete(eid);
    }
  });

  shapeExitQuery(world).forEach(eid => physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]));

  rigidbodyExitedQuery(world).forEach(eid => {
    if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
      // The PhysicsShape is still on this entity!
    }
    physicsSystem.removeBody(Rigidbody.bodyId[eid]);
  });
};
