// https://dev.reticulum.io/scenes/7vGnzkM/outdoor-meetup
// A scene with media-frames

import {
  defineQuery,
  enterQuery,
  exitQuery,
  entityExists,
  hasComponent,
  addEntity,
  removeEntity,
  addComponent
} from "bitecs";
import {
  AEntity,
  Deleting,
  GLTFModel,
  Held,
  MediaContentBounds,
  MediaFrame,
  MediaImage,
  MediaLoaded,
  MediaLoading,
  MediaPDF,
  MediaVideo,
  Networked,
  NetworkedMediaFrame,
  Owned,
  Rigidbody
} from "../bit-components";
import { MediaType } from "../utils/media-utils";
import { cloneObject3D, createPlaneBufferGeometry, disposeNode, setMatrixWorld } from "../utils/three-utils";
import { takeOwnership } from "../utils/take-ownership";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { TEXTURES_FLIP_Y } from "../loaders/HubsTextureLoader";
import { addObject3DComponent } from "../utils/jsx-entity";
import { updateMaterials } from "../utils/material-utils";
import {
  Box3,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  Quaternion,
  RGBAFormat,
  Vector3
} from "three";

const EMPTY_COLOR = 0x6fc0fd;
const HOVER_COLOR = 0x2f80ed;
const FULL_COLOR = 0x808080;

const mediaFramesQuery = defineQuery([MediaFrame]);
const enteredMediaFramesQuery = enterQuery(mediaFramesQuery);
const exitedMediaFramesQuery = exitQuery(mediaFramesQuery);

function mediaTypeMaskFor(world, eid) {
  let mediaTypeMask = 0;
  if (hasComponent(world, AEntity, eid)) {
    const el = world.eid2obj.get(eid).el;
    mediaTypeMask |= el.components["gltf-model-plus"] && MediaType.MODEL;
    mediaTypeMask |= el.components["media-video"] && MediaType.VIDEO;
    mediaTypeMask |= el.components["media-image"] && MediaType.IMAGE;
    mediaTypeMask |= el.components["media-pdf"] && MediaType.PDF;
  } else {
    const mediaEid = findChildWithComponent(world, MediaLoaded, eid);
    mediaTypeMask |= hasComponent(world, GLTFModel, mediaEid) && MediaType.MODEL;
    mediaTypeMask |= hasComponent(world, MediaVideo, mediaEid) && MediaType.VIDEO;
    mediaTypeMask |= hasComponent(world, MediaImage, mediaEid) && MediaType.IMAGE;
    mediaTypeMask |= hasComponent(world, MediaPDF, mediaEid) && MediaType.PDF;
  }
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

function getCapturableEntity(world, physicsSystem, frame) {
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

function isEntityColliding(physicsSystem, eidA, eidB) {
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

function scaleForAspectFit(containerSize, itemSize) {
  return Math.min(containerSize[0] / itemSize.x, containerSize[1] / itemSize.y, containerSize[2] / itemSize.z);
}

const snapToFrame = (() => {
  const framePos = new Vector3();
  const frameQuat = new Quaternion();
  const frameScale = new Vector3();
  const m4 = new Matrix4();
  const contentBounds = new Vector3();

  return (world, frame, target) => {
    const frameObj = world.eid2obj.get(frame);
    const targetObj = world.eid2obj.get(target);

    frameObj.updateMatrices();
    frameObj.matrixWorld.decompose(framePos, frameQuat, frameScale);

    contentBounds.fromArray(MediaContentBounds.bounds[target]);
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

const setMatrixScale = (() => {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  const m4 = new Matrix4();

  return (obj, scaleArray) => {
    obj.updateMatrices();
    obj.matrixWorld.decompose(position, quaternion, scale);
    setMatrixWorld(obj, m4.compose(position, quaternion, scale.fromArray(scaleArray)));
  };
})();

const videoGeometry = createPlaneBufferGeometry(1, 1, 1, 1, TEXTURES_FLIP_Y);
const previewMaterial = new MeshBasicMaterial();
previewMaterial.side = DoubleSide;
previewMaterial.transparent = true;
previewMaterial.opacity = 0.5;
function createPreviewMesh(world, capturable) {
  let srcMesh;
  let el;
  let previewMesh;
  let isVideo = false;
  let ratio = 1;
  if (hasComponent(world, AEntity, capturable)) {
    el = world.eid2obj.get(capturable).el;
    const video = el.components["media-video"];
    isVideo = !!video;
    if (isVideo) {
      ratio =
        (video.videoTexture.image.videoHeight || video.videoTexture.image.height) /
        (video.videoTexture.image.videoWidth || video.videoTexture.image.width);
    }
    srcMesh = el.getObject3D("mesh");
  } else {
    const mediaEid = findChildWithComponent(world, MediaLoaded, capturable);
    isVideo = hasComponent(world, MediaVideo, mediaEid);
    if (isVideo) {
      ratio = MediaVideo.ratio[mediaEid];
    }
    srcMesh = world.eid2obj.get(mediaEid);
  }

  // Audios can't be cloned so we take a different path for them
  if (isVideo) {
    previewMesh = new Mesh(videoGeometry, previewMaterial);
    previewMesh.material.map = srcMesh.material.map;
    previewMesh.material.needsUpdate = true;
    // Preview mesh UVs are set to accommodate textureLoader default, but video textures don't match this
    previewMesh.scale.y *= TEXTURES_FLIP_Y !== previewMesh.material.map.flipY ? -ratio : ratio;
  } else {
    previewMesh = cloneObject3D(srcMesh, false);
    previewMesh.traverse(node => {
      updateMaterials(node, function (srcMat) {
        const mat = srcMat.clone();
        mat.transparent = true;
        mat.opacity = 0.5;
        mat.format = RGBAFormat;
        mat.blending = NormalBlending;
        node.material = mat;
        return mat;
      });
    });
  }

  // TODO HACK We add this mesh to a group whose position is centered
  //      so that putting this in the middle of a media frame is easy,
  //      but we should just do this math when putting an object into a frame
  //      and not assume an object's root is in the center of its geometry.
  previewMesh.position.setScalar(0);
  previewMesh.quaternion.identity();
  previewMesh.matrixNeedsUpdate = true;
  const aabb = new Box3().setFromObject(previewMesh);
  aabb.getCenter(previewMesh.position).multiplyScalar(-1);
  previewMesh.matrixNeedsUpdate = true;

  const cloneObj = new Group();
  cloneObj.add(previewMesh);
  world.scene.add(cloneObj);

  hasComponent(world, AEntity, capturable) && (cloneObj.el = el);

  return cloneObj;
}

function showPreview(world, frame, capturable) {
  const previewObj = createPreviewMesh(world, capturable);
  const eid = addEntity(world);
  addObject3DComponent(world, eid, previewObj);
  addComponent(world, MediaContentBounds, eid);
  MediaContentBounds.bounds[eid].set(MediaContentBounds.bounds[capturable]);

  MediaFrame.preview[frame] = eid;
  MediaFrame.previewingNid[frame] = Networked.id[capturable];
  snapToFrame(world, frame, eid);
}

function hidePreview(world, frame) {
  // NOTE we intentionally do not dispose of geometries or textures since they are all shared with the original object
  const eid = MediaFrame.preview[frame];
  removeEntity(world, eid);

  MediaFrame.preview[frame] = 0;
  MediaFrame.previewingNid[frame] = 0;
}

const zero = [0, 0, 0];
const tmpVec3 = new Vector3();

export function display(world, physicsSystem, frame, capturedEid, heldMediaTypes) {
  const capturable = !MediaFrame.capturedNid[frame] && getCapturableEntity(world, physicsSystem, frame);
  const shouldPreviewBeVisible =
    (capturable && findChildWithComponent(world, Held, capturable)) ||
    (capturedEid && findChildWithComponent(world, Held, capturedEid));
  if (shouldPreviewBeVisible && !MediaFrame.preview[frame]) {
    showPreview(world, frame, capturable ? capturable : capturedEid);
  } else if (!shouldPreviewBeVisible && MediaFrame.preview[frame]) {
    hidePreview(world, frame);
  }

  const guideEid = MediaFrame.guide[frame];
  const guideObj = world.eid2obj.get(guideEid);
  guideObj.visible = !!(MediaFrame.mediaType[frame] & heldMediaTypes);

  if (guideObj.visible) {
    const capturedEid = world.nid2eid.get(MediaFrame.capturedNid[frame]) || 0;
    const isHoldingObjectOfInterest =
      (capturedEid && findChildWithComponent(world, Held, capturedEid)) ||
      (capturable && findChildWithComponent(world, Held, capturable));

    guideObj.material.uniforms.color.value.set(
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

export function cleanupMediaFrame(obj) {
  obj.traverse(child => {
    disposeNode(child);
  });
}

const takeOwnershipOnTimeout = new Map();
const heldQuery = defineQuery([Held]);
// const droppedQuery = exitQuery(heldQuery);
export function mediaFramesSystem(world, physicsSystem) {
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

    const guideObj = world.eid2obj.get(MediaFrame.guide[eid]);
    const frameObj = world.eid2obj.get(eid);
    frameObj.add(guideObj);
  });

  exitedMediaFramesQuery(world).forEach(eid => {
    const timeout = takeOwnershipOnTimeout.get(eid);
    if (timeout) {
      clearTimeout(timeout);
      takeOwnershipOnTimeout.delete(eid);
    }
  });

  const heldMediaTypes = mediaTypesOf(world, heldQuery(world));
  // const droppedEntities = droppedQuery(world).filter(eid => entityExists(world, eid));
  const mediaFrames = mediaFramesQuery(world);

  for (let i = 0; i < mediaFrames.length; i++) {
    const frame = mediaFrames[i];

    const capturedEid = world.nid2eid.get(MediaFrame.capturedNid[frame]) || 0;
    const isCapturedOwned = hasComponent(world, Owned, capturedEid);
    const isCapturedHeld = findChildWithComponent(world, Held, capturedEid);
    const isCapturedColliding = capturedEid && isEntityColliding(physicsSystem, frame, capturedEid);
    const isFrameDeleting = findAncestorWithComponent(world, Deleting, frame);
    const isFrameOwned = hasComponent(world, Owned, frame);

    if (capturedEid && isCapturedOwned && !isCapturedHeld && !isFrameDeleting && isCapturedColliding) {
      snapToFrame(world, frame, capturedEid);
      physicsSystem.updateRigidBodyOptions(capturedEid, { type: "kinematic" });
    } else if (
      (isFrameOwned && MediaFrame.capturedNid[frame] && world.deletedNids.has(MediaFrame.capturedNid[frame])) ||
      (capturedEid && isCapturedOwned && !isCapturedColliding) ||
      isFrameDeleting
    ) {
      takeOwnership(world, frame);
      NetworkedMediaFrame.capturedNid[frame] = 0;
      NetworkedMediaFrame.scale[frame].set(zero);
      // TODO BUG: If an entity I do not own is capturedEid by the media frame,
      //           and then I take ownership of the entity (by grabbing it),
      //           the physics system does not immediately notice the entity isCapturedColliding with the frame,
      //           so I immediately think the frame should be emptied.
    } else if (isFrameOwned && MediaFrame.capturedNid[frame] && !capturedEid) {
      NetworkedMediaFrame.capturedNid[frame] = 0;
      NetworkedMediaFrame.scale[frame].set(zero);
    } else if (!NetworkedMediaFrame.capturedNid[frame]) {
      const capturable = getCapturableEntity(world, physicsSystem, frame);
      if (
        capturable &&
        (hasComponent(world, Owned, capturable) || (isOwnedByRet(world, capturable) && isFrameOwned)) &&
        !findChildWithComponent(world, Held, capturable) &&
        !inOtherFrame(world, frame, capturable)
      ) {
        takeOwnership(world, frame);
        takeOwnership(world, capturable);
        NetworkedMediaFrame.capturedNid[frame] = Networked.id[capturable];
        const obj = world.eid2obj.get(capturable);
        obj.updateMatrices();
        tmpVec3.setFromMatrixScale(obj.matrixWorld).toArray(NetworkedMediaFrame.scale[frame]);
        snapToFrame(world, frame, capturable);
        physicsSystem.updateRigidBodyOptions(capturable, { type: "kinematic" });
      }
    }

    if (
      NetworkedMediaFrame.capturedNid[frame] !== MediaFrame.capturedNid[frame] &&
      capturedEid &&
      entityExists(world, capturedEid) &&
      isCapturedOwned
    ) {
      // TODO: If you are resetting scale because you lost a race for the frame,
      //       you should probably also move the object away from the frame.
      setMatrixScale(world.eid2obj.get(capturedEid), MediaFrame.scale[frame]);
      physicsSystem.updateRigidBodyOptions(capturedEid, { type: "dynamic" });
    }

    MediaFrame.capturedNid[frame] = NetworkedMediaFrame.capturedNid[frame];
    MediaFrame.scale[frame].set(NetworkedMediaFrame.scale[frame]);

    display(world, physicsSystem, frame, capturedEid, heldMediaTypes);
  }
}
