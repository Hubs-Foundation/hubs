// https://dev.reticulum.io/scenes/7vGnzkM/outdoor-meetup
// A scene with media-frames
import { addObject3DComponent, MediaFramePreviewClone, Held, Rigidbody } from "../utils/jsx-entity";
import { MediaType } from "../utils/media-utils";
import {
  addComponent,
  removeComponent,
  addEntity,
  defineComponent,
  defineQuery,
  entityExists,
  exitQuery,
  hasComponent
} from "bitecs";
import { cloneObject3D, setMatrixWorld } from "../utils/three-utils";
import { FrameUpdate, MediaFrame, Owned } from "../bit-components";
import { takeOwnership } from "./netcode";

const EMPTY_COLOR = 0x6fc0fd;
const HOVER_COLOR = 0x2f80ed;
const FULL_COLOR = 0x808080;

function mediaTypeMaskFor(world, eid) {
  const obj = world.eid2obj.get(eid);
  let mediaTypeMask = 0;
  // TODO AFRAME
  mediaTypeMask |= obj.el.components["gltf-model-plus"] && MediaType.MODEL;
  mediaTypeMask |= obj.el.components["media-video"] && MediaType.VIDEO;
  mediaTypeMask |= obj.el.components["media-image"] && MediaType.IMAGE;
  mediaTypeMask |= obj.el.components["media-pdf"] && MediaType.PDF;
  return mediaTypeMask;
}

function getCapturableEntity(world, frameEid) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[frameEid]);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    if (MediaFrame.mediaType[frameEid] & mediaTypeMaskFor(world, bodyData.object3D.eid)) {
      return bodyData.object3D.eid;
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
  const targetPos = new THREE.Vector3();
  const targetQuat = new THREE.Quaternion();
  const targetScale = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const box = new THREE.Box3();
  const size = new THREE.Vector3();

  function scaleForAspectFit(containerSize, itemSize) {
    return Math.min(containerSize[0] / itemSize.x, containerSize[1] / itemSize.y, containerSize[2] / itemSize.z);
  }

  // Explicitly pass which mesh you want to fit into the frame,
  // because in the case of the preview the targetEid is associated with the mesh,
  // but in the case of snapping the object, the targetEid is a parent of the mesh,
  // which also has children like the menu.
  // TODO Is there a nicer way to factor this?
  return function snapToFrame(world, frameEid, targetEid, meshToFit) {
    const frameObj = world.eid2obj.get(frameEid);
    const targetObj = world.eid2obj.get(targetEid);
    frameObj.updateMatrices();
    targetObj.updateMatrices();

    frameObj.matrixWorld.decompose(framePos, frameQuat, frameScale);
    targetObj.matrixWorld.decompose(targetPos, targetQuat, targetScale);

    // TODO BUG: It seems like objects aren't always snapping to the correct size.
    //
    //
    // TODO: Do we have to reset rotation for correct box calculation?
    //       Should we reset the rotation to identity or to match the frame?
    //
    // setMatrixWorld(
    //   targetObj,
    //   m4.compose(
    //     targetPos,
    //     targetQuat.copy(frameQuat),
    //     targetScale
    //   )
    // );

    // TODO: BUG Does box.setFromObject does correctly account for out-of-date matrices?
    //           It seems like we have to update all the objects in the mesh hierarchy
    meshToFit.traverse(o => o.updateMatrices());
    // meshToFit.updateMatrices(); // Shouldn't this do the trick?

    // Snap into frame
    setMatrixWorld(
      targetObj,
      m4.compose(
        targetPos.copy(framePos),
        targetQuat.copy(frameQuat),
        targetScale.multiplyScalar(
          scaleForAspectFit(MediaFrame.bounds[frameEid], box.setFromObject(meshToFit).getSize(size))
        )
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
  setMatrixWorld(
    obj,
    m4.compose(
      position,
      quaternion,
      scale.fromArray(scaleArray)
    )
  );
}

function makeMeshClone(obj) {
  // TODO AFRAME
  const mesh = obj.el.getObject3D("mesh");
  const meshClone = cloneObject3D(mesh, false);

  meshClone.traverse(node => {
    if (node.isMesh) {
      if (node.material) {
        // TODO: Why isn't this transparent for ducky?
        node.material = node.material.clone();
        node.material.transparent = true;
        node.material.opacity = 0.5;
        node.material.needsUpdate = true;
      }
    }
  });

  // TODO AFRAME
  const loopAnimation = obj.el.components["loop-animation"];
  if (loopAnimation && loopAnimation.isPlaying) {
    const originalAnimation = loopAnimation.currentActions[loopAnimation.data.activeClipIndex];
    const animation = meshClone.animations[loopAnimation.data.activeClipIndex];
    // TODO: What do I do with this mixer?
    // For now, just stick it on the clone?
    meshClone.mixer = new THREE.AnimationMixer(meshClone);
    const action = meshClone.mixer.clipAction(animation);
    action.syncWith(originalAnimation);
    action.setLoop(THREE.LoopRepeat, Infinity).play();
  }

  return meshClone;
}

function cloneForPreview(world, eid) {
  const obj = world.eid2obj.get(eid);
  const meshClone = makeMeshClone(obj);
  // TODO HACK We add this mesh to a group whose position is centered
  //      so that putting this in the middle of a media frame is easy,
  //      but we should just do this math when putting an object into a frame
  //      and not assume an object's root is in the center of its geometry.
  meshClone.position.setScalar(0);
  meshClone.quaternion.identity();
  meshClone.matrixNeedsUpdate = true;
  // TODO BUG Explicitly update the hierarchy so that box setFromObject is correct
  meshClone.traverse(o => o.updateMatrices());
  const aabb = new THREE.Box3().setFromObject(meshClone);
  const size = aabb.getSize(new THREE.Vector3());
  const center = aabb.getCenter(new THREE.Vector3());
  meshClone.position.copy(center).multiplyScalar(-1);
  meshClone.matrixNeedsUpdate = true;

  const cloneObj = new THREE.Group();
  cloneObj.add(meshClone);

  const cloneEid = addEntity(world);
  addObject3DComponent(world, cloneEid, cloneObj);
  // TODO Aframe
  AFRAME.scenes[0].object3D.add(cloneObj);
  return cloneEid;
}

// TODO: If the preview is created while loading, then we just cached a loading cube clone
function showPreview(world, frameEid, capturableEid) {
  let cloneEid = MediaFramePreviewClone.preview[capturableEid];
  if (!cloneEid) {
    cloneEid = cloneForPreview(world, capturableEid);
    MediaFramePreviewClone.preview[capturableEid] = cloneEid;
  }
  const cloneObj = world.eid2obj.get(cloneEid);
  cloneObj.visible = true;
  MediaFrame.preview[frameEid] = cloneEid;
  snapToFrame(world, frameEid, cloneEid, cloneObj);

  // If there is a mixer, we need to re-sync the animations
  const meshClone = cloneObj.children[0];
  if (meshClone.mixer) {
    const capturableObj = world.eid2obj.get(capturableEid);
    const loopAnimation = capturableObj.el.components["loop-animation"];
    if (loopAnimation && loopAnimation.isPlaying) {
      const originalAnimation = loopAnimation.currentActions[loopAnimation.data.activeClipIndex];
      const animation = meshClone.animations[loopAnimation.data.activeClipIndex];
      const action = meshClone.mixer.clipAction(animation);
      action.syncWith(originalAnimation);
      action.setLoop(THREE.LoopRepeat, Infinity).play();
    }
  }
}

function hidePreview(world, frameEid) {
  const previewObj = world.eid2obj.get(MediaFrame.preview[frameEid]);
  if (previewObj.mixer) {
    previewObj.mixer.stopAllAction();
    previewObj.mixer.uncacheRoot(previewObj);
  }

  // TODO: Remove from scene graph?
  previewObj.visible = false;
  MediaFrame.preview[frameEid] = 0;
}

const zero = [0, 0, 0];
const vec3 = new THREE.Vector3();
function maybeAddFrameUpdate(world, frameEid) {
  if (hasComponent(world, FrameUpdate, frameEid)) {
    // Nothing to do here. We need to apply the pending change
    return;
  }

  if (
    MediaFrame.captured[frameEid] &&
    hasComponent(world, Owned, frameEid) &&
    !entityExists(world, MediaFrame.captured[frameEid])
  ) {
    // Captured entity was deleted from my frame
    addComponent(world, FrameUpdate, frameEid);
    FrameUpdate.captured[frameEid] = 0;
    FrameUpdate.isFull[frameEid] = 0;
    FrameUpdate.scale[frameEid].set(zero);
    return;
  }

  if (
    MediaFrame.captured[frameEid] &&
    hasComponent(world, Owned, MediaFrame.captured[frameEid]) &&
    !isColliding(world, frameEid, MediaFrame.captured[frameEid])
  ) {
    // My captured entity left the frame
    addComponent(world, FrameUpdate, frameEid);
    FrameUpdate.captured[frameEid] = 0;
    FrameUpdate.isFull[frameEid] = 0;
    FrameUpdate.scale[frameEid].set(zero);
    // TODO BUG: If an entity I do not own is captured by the media frame,
    //           and then I take ownership of the entity (by grabbing it),
    //           the physics system does not immediately notice the entity colliding with the frame,
    //           so I immediately think the frame should be emptied.
    return;
  }

  if (!MediaFrame.isFull[frameEid]) {
    const capturable = getCapturableEntity(world, frameEid);
    if (capturable && hasComponent(world, Owned, capturable) && !hasComponent(world, Held, capturable)) {
      // Capture my entity
      addComponent(world, FrameUpdate, frameEid);
      FrameUpdate.captured[frameEid] = capturable;
      FrameUpdate.isFull[frameEid] = 1;
      const obj = world.eid2obj.get(capturable);
      obj.updateMatrices();
      vec3.setFromMatrixScale(obj.matrixWorld).toArray(FrameUpdate.scale[frameEid]);
      return;
    }
  }

  // No change
  return;
}

export function applyFrameUpdate(world, frameEid) {
  if (!hasComponent(world, FrameUpdate, frameEid)) return;

  // CAUTION: We cannot ONLY check whether the captured entity has changed, because
  //          we sometimes know a media frame is full without knowing what it captured.
  if (
    FrameUpdate.captured[frameEid] === MediaFrame.captured[frameEid] &&
    FrameUpdate.isFull[frameEid] === MediaFrame.isFull[frameEid]
  ) {
    // Nothing to do
    return;
  }

  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  if (
    MediaFrame.captured[frameEid] &&
    entityExists(world, MediaFrame.captured[frameEid]) &&
    hasComponent(world, Owned, MediaFrame.captured[frameEid])
  ) {
    console.log("Releasing entity from frame.");
    // Remove my captured entity from the frame and restore its original scale
    setMatrixScale(world.eid2obj.get(MediaFrame.captured[frameEid]), MediaFrame.scale[frameEid]);
    physicsSystem.updateBodyOptions(Rigidbody.bodyId[MediaFrame.captured[frameEid]], { type: "dynamic" });
  }

  if (FrameUpdate.captured[frameEid] && hasComponent(world, Owned, FrameUpdate.captured[frameEid])) {
    console.log("Capturing entity from frame.");
    // Capture my entity
    takeOwnership(world, frameEid);
    snapToFrame(
      world,
      frameEid,
      FrameUpdate.captured[frameEid],
      world.eid2obj.get(FrameUpdate.captured[frameEid]).el.getObject3D("mesh")
    );
    physicsSystem.updateBodyOptions(Rigidbody.bodyId[FrameUpdate.captured[frameEid]], {
      type: "kinematic"
    });
  }

  MediaFrame.isFull[frameEid] = FrameUpdate.isFull[frameEid];
  MediaFrame.captured[frameEid] = FrameUpdate.captured[frameEid];
  MediaFrame.scale[frameEid].set(FrameUpdate.scale[frameEid]);
}

export function display(world, frameEid, heldMediaTypes) {
  // Display the state
  const capturable = !MediaFrame.isFull[frameEid] && getCapturableEntity(world, frameEid);
  const shouldPreviewBeVisible = capturable && hasComponent(world, Held, capturable);
  if (shouldPreviewBeVisible && !MediaFrame.preview[frameEid]) showPreview(world, frameEid, capturable);
  if (!shouldPreviewBeVisible && MediaFrame.preview[frameEid]) hidePreview(world, frameEid);

  const frameObj = world.eid2obj.get(frameEid);
  frameObj.visible = !!(MediaFrame.mediaType[frameEid] & heldMediaTypes);
  if (frameObj.visible) {
    const isHoldingObjectOfInterest =
      (capturable && hasComponent(world, Held, capturable)) ||
      (MediaFrame.captured[frameEid] && hasComponent(world, Held, MediaFrame.captured[frameEid]));

    frameObj.material.uniforms.color.value.set(
      isHoldingObjectOfInterest ? HOVER_COLOR : MediaFrame.isFull[frameEid] ? FULL_COLOR : EMPTY_COLOR
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

const heldQuery = defineQuery([Held]);
const droppedQuery = exitQuery(heldQuery);
const mediaFramesQuery = defineQuery([MediaFrame]);
export function mediaFramesSystem(world) {
  const heldMediaTypes = mediaTypesOf(world, heldQuery(world));
  const droppedEntites = droppedQuery(world);
  const mediaFrames = mediaFramesQuery(world);

  for (let i = 0; i < mediaFrames.length; i++) {
    const frameEid = mediaFrames[i];

    if (
      MediaFrame.captured[frameEid] &&
      hasComponent(world, Owned, MediaFrame.captured[frameEid]) &&
      droppedEntites.includes(MediaFrame.captured[frameEid])
    ) {
      // I dropped my captured entity. Snap it back into place.
      snapToFrame(
        world,
        frameEid,
        MediaFrame.captured[frameEid],
        world.eid2obj.get(MediaFrame.captured[frameEid]).el.getObject3D("mesh")
      );
      AFRAME.scenes[0].systems["hubs-systems"].physicsSystem.updateBodyOptions(
        Rigidbody.bodyId[MediaFrame.captured[frameEid]],
        { type: "kinematic" }
      );
    }

    maybeAddFrameUpdate(world, frameEid);
    if (hasComponent(world, FrameUpdate, frameEid)) {
      applyFrameUpdate(world, frameEid);
      removeComponent(world, FrameUpdate, frameEid);
    }

    display(world, frameEid, heldMediaTypes);
  }
}
