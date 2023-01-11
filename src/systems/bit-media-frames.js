// https://dev.reticulum.io/scenes/7vGnzkM/outdoor-meetup
// A scene with media-frames

import { addEntity, defineQuery, enterQuery, exitQuery, entityExists, hasComponent, removeEntity } from "bitecs";
import {
  AEntity,
  Held,
  MediaFrame,
  MediaLoading,
  Networked,
  NetworkedMediaFrame,
  Owned,
  Rigidbody
} from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { updateMaterials } from "../utils/material-utils";
import { MediaType } from "../utils/media-utils";
import { cloneObject3D, setMatrixWorld } from "../utils/three-utils";
import { takeOwnership } from "../utils/take-ownership";
import { takeSoftOwnership } from "../utils/take-soft-ownership";

const EMPTY_COLOR = 0x6fc0fd;
const HOVER_COLOR = 0x2f80ed;
const FULL_COLOR = 0x808080;

const mediaFramesQuery = defineQuery([MediaFrame]);
const enteredMediaFramesQuery = enterQuery(mediaFramesQuery);
const exitedMediaFramesQuery = exitQuery(mediaFramesQuery);

// TODO currently only aframe entiteis can be placed in media frames
function mediaTypeMaskFor(world, eid) {
  if (!hasComponent(world, AEntity, eid)) return 0;

  const el = world.eid2obj.get(eid).el;
  let mediaTypeMask = 0;
  mediaTypeMask |= el.components["gltf-model-plus"] && MediaType.MODEL;
  mediaTypeMask |= el.components["media-video"] && MediaType.VIDEO;
  mediaTypeMask |= el.components["media-image"] && MediaType.IMAGE;
  mediaTypeMask |= el.components["media-pdf"] && MediaType.PDF;
  return mediaTypeMask;
}

function isAncestor(a, b) {
  let ancestor = b.parent;
  while (ancestor) {
    if (ancestor === a) return true;
    ancestor = ancestor.parent;
  }
  return false;
}

function isOwnedByRet(world, eid) {
  if (hasComponent(world, AEntity, eid)) {
    const networkedEl = world.eid2obj.get(eid).el;
    const owner = NAF.utils.getNetworkOwner(networkedEl);
    // Legacy networked objects don't set "reticulum" as the owner
    return owner === "scene";
  } else {
    return Networked.owner[eid] === APP.getSid("reticulum");
  }
}

function inOtherFrame(world, ignoredFrame, eid) {
  const frames = mediaFramesQuery(world);
  for (const frame of frames) {
    if (frame === ignoredFrame) continue;
    if (MediaFrame.capturedNid[frame] === Networked.id[eid] || MediaFrame.previewingNid[frame] === Networked.id[eid])
      return true;
  }
  return false;
}

function getCapturableEntity(world, frame) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[frame]);
  const frameObj = world.eid2obj.get(frame);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    const eid = bodyData.object3D.eid;
    if (
      MediaFrame.mediaType[frame] & mediaTypeMaskFor(world, eid) &&
      !hasComponent(world, MediaLoading, eid) &&
      !inOtherFrame(world, frame, eid) &&
      !isAncestor(bodyData.object3D, frameObj)
    ) {
      return eid;
    }
  }
  return null;
}

function isColliding(world, eidA, eidB) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eidA]);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    const collidedEid = bodyData && bodyData.object3D && bodyData.object3D.eid;
    if (collidedEid === eidB) {
      return true;
    }
  }
  return false;
}

const snapToFrame = (() => {
  const framePos = new THREE.Vector3();
  const frameQuat = new THREE.Quaternion();
  const frameScale = new THREE.Vector3();
  const m4 = new THREE.Matrix4();

  function scaleForAspectFit(containerSize, itemSize) {
    return Math.min(containerSize[0] / itemSize.x, containerSize[1] / itemSize.y, containerSize[2] / itemSize.z);
  }

  return function snapToFrame(world, frame, target) {
    const frameObj = world.eid2obj.get(frame);
    const targetObj = world.eid2obj.get(target);

    frameObj.updateMatrices();
    frameObj.matrixWorld.decompose(framePos, frameQuat, frameScale);

    // TODO we only allow capturing media-loader so rely on its bounds calculations for now
    const contentBounds = targetObj.el.components["media-loader"].contentBounds;

    setMatrixWorld(
      targetObj,
      m4.compose(
        framePos,
        frameQuat,
        frameScale.multiplyScalar(scaleForAspectFit(MediaFrame.bounds[frame], contentBounds))
      )
    );
  };
})();

function setMatrixScale(obj, scaleArray) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  obj.updateMatrices();
  obj.matrixWorld.decompose(position, quaternion, scale);
  setMatrixWorld(obj, m4.compose(position, quaternion, scale.fromArray(scaleArray)));
}

function cloneForPreview(world, eid) {
  // TODO We assume capturable object is an AFRAME entity
  const el = world.eid2obj.get(eid).el;
  const mesh = el.getObject3D("mesh");
  const meshClone = cloneObject3D(mesh, false);
  meshClone.traverse(node => {
    updateMaterials(node, function (srcMat) {
      const mat = srcMat.clone();
      mat.transparent = true;
      mat.opacity = 0.5;
      mat.format = THREE.RGBAFormat;
      mat.blending = THREE.NormalBlending;
      node.material = mat;
      return mat;
    });
  });

  // TODO play animations on previews

  // TODO HACK We add this mesh to a group whose position is centered
  //      so that putting this in the middle of a media frame is easy,
  //      but we should just do this math when putting an object into a frame
  //      and not assume an object's root is in the center of its geometry.
  meshClone.position.setScalar(0);
  meshClone.quaternion.identity();
  meshClone.matrixNeedsUpdate = true;
  const aabb = new THREE.Box3().setFromObject(meshClone);
  aabb.getCenter(meshClone.position).multiplyScalar(-1);
  meshClone.matrixNeedsUpdate = true;

  const cloneObj = new THREE.Group();
  cloneObj.el = el; // We rely on media-loader component for bounds
  cloneObj.add(meshClone);
  AFRAME.scenes[0].object3D.add(cloneObj);

  return addObject3DComponent(world, addEntity(world), cloneObj);
}

function showPreview(world, frame, capturable) {
  const clone = cloneForPreview(world, capturable);
  MediaFrame.preview[frame] = clone;
  MediaFrame.previewingNid[frame] = Networked.id[capturable];
  snapToFrame(world, frame, clone);
}

function hidePreview(world, frame) {
  // NOTE we intentionally do not dispose of geometries or textures since they are all shared with the original object
  removeEntity(world, MediaFrame.preview[frame]);
  MediaFrame.preview[frame] = 0;
  MediaFrame.previewingNid[frame] = 0;
}

const zero = [0, 0, 0];
const tmpVec3 = new THREE.Vector3();

export function display(world, frame, heldMediaTypes) {
  const capturable = !MediaFrame.capturedNid[frame] && getCapturableEntity(world, frame);
  const shouldPreviewBeVisible = capturable && hasComponent(world, Held, capturable);
  if (shouldPreviewBeVisible && !MediaFrame.preview[frame]) {
    showPreview(world, frame, capturable);
  } else if (!shouldPreviewBeVisible && MediaFrame.preview[frame]) {
    hidePreview(world, frame);
  }

  const frameObj = world.eid2obj.get(frame);
  frameObj.visible = !!(MediaFrame.mediaType[frame] & heldMediaTypes);

  if (frameObj.visible) {
    const captured = world.nid2eid.get(MediaFrame.capturedNid[frame]) || 0;
    const isHoldingObjectOfInterest =
      (captured && hasComponent(world, Held, captured)) || (capturable && hasComponent(world, Held, capturable));

    frameObj.material.uniforms.color.value.set(
      isHoldingObjectOfInterest ? HOVER_COLOR : MediaFrame.capturedNid[frame] ? FULL_COLOR : EMPTY_COLOR
    );
  }
}

function mediaTypesOf(world, entities) {
  let mask = 0;
  for (let i = 0; i < entities.length; i++) {
    mask |= mediaTypeMaskFor(world, entities[i]);
  }
  return mask;
}

const takeOwnershipOnTimeout = new Map();
const heldQuery = defineQuery([Held]);
// const droppedQuery = exitQuery(heldQuery);
export function mediaFramesSystem(world) {
  enteredMediaFramesQuery(world).forEach(eid => {
    if (Networked.owner[eid] === APP.getSid("reticulum")) {
      takeOwnershipOnTimeout.set(
        eid,
        setTimeout(() => {
          if (Networked.owner[eid] === APP.getSid("reticulum")) {
            takeSoftOwnership(world, eid);
          }
          takeOwnershipOnTimeout.delete(eid);
        }, 10000)
      );
    }
  });

  exitedMediaFramesQuery(world).forEach(eid => {
    const timeout = takeOwnershipOnTimeout.get(eid);
    if (timeout) {
      clearTimeout(timeout);
      takeOwnershipOnTimeout.delete(eid);
    }
  });

  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const heldMediaTypes = mediaTypesOf(world, heldQuery(world));
  // const droppedEntities = droppedQuery(world).filter(eid => entityExists(world, eid));
  const mediaFrames = mediaFramesQuery(world);

  for (let i = 0; i < mediaFrames.length; i++) {
    const frame = mediaFrames[i];

    const captured = world.nid2eid.get(MediaFrame.capturedNid[frame]) || 0;
    const colliding = captured && isColliding(world, frame, captured);

    if (captured && hasComponent(world, Owned, captured) && !hasComponent(world, Held, captured) && colliding) {
      snapToFrame(world, frame, captured);
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[captured], { type: "kinematic" });
    } else if (
      (hasComponent(world, Owned, frame) &&
        MediaFrame.capturedNid[frame] &&
        world.deletedNids.has(MediaFrame.capturedNid[frame])) ||
      (captured && hasComponent(world, Owned, captured) && !colliding)
    ) {
      takeOwnership(world, frame);
      NetworkedMediaFrame.capturedNid[frame] = 0;
      NetworkedMediaFrame.scale[frame].set(zero);
      // TODO BUG: If an entity I do not own is captured by the media frame,
      //           and then I take ownership of the entity (by grabbing it),
      //           the physics system does not immediately notice the entity colliding with the frame,
      //           so I immediately think the frame should be emptied.
    } else if (!NetworkedMediaFrame.capturedNid[frame]) {
      const capturable = getCapturableEntity(world, frame);
      if (
        capturable &&
        (hasComponent(world, Owned, capturable) ||
          (isOwnedByRet(world, capturable) && hasComponent(world, Owned, frame))) &&
        !hasComponent(world, Held, capturable) &&
        !inOtherFrame(world, frame, capturable)
      ) {
        takeOwnership(world, frame);
        takeOwnership(world, capturable);
        NetworkedMediaFrame.capturedNid[frame] = Networked.id[capturable];
        const obj = world.eid2obj.get(capturable);
        obj.updateMatrices();
        tmpVec3.setFromMatrixScale(obj.matrixWorld).toArray(NetworkedMediaFrame.scale[frame]);
        snapToFrame(world, frame, capturable);
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[capturable], { type: "kinematic" });
      }
    }

    if (
      NetworkedMediaFrame.capturedNid[frame] !== MediaFrame.capturedNid[frame] &&
      captured &&
      entityExists(world, captured) &&
      hasComponent(world, Owned, captured)
    ) {
      // TODO: If you are resetting scale because you lost a race for the frame,
      //       you should probably also move the object away from the frame.
      setMatrixScale(world.eid2obj.get(captured), MediaFrame.scale[frame]);
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[captured], { type: "dynamic" });
    }

    MediaFrame.capturedNid[frame] = NetworkedMediaFrame.capturedNid[frame];
    MediaFrame.scale[frame].set(NetworkedMediaFrame.scale[frame]);

    display(world, frame, heldMediaTypes);
  }
}
