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
import { NetworkedMediaFrame, MediaFrame, Owned } from "../bit-components";
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

    // Reset rotation for correct box calculation
    // setMatrixWorld(
    //   targetObj,
    //   m4.compose(
    //     targetPos,
    //     targetQuat.copy(frameQuat),
    //     targetScale
    //   )
    // );

    // TODO: BUG box.setFromObject does not correctly account for out-of-date matrices.
    //       We must update all the objects in the mesh hierarchy ourselves
    meshToFit.traverse(o => o.updateMatrices());
    //       Updating the mesh alone is not enough;
    //       We need the updates to flush down to the children.
    //       i.e. This does not work: meshToFit.updateMatrices();

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

function step(world, frameEid) {
  if (hasComponent(world, NetworkedMediaFrame, frameEid)) {
    const state = {
      newCapturedEntity: NetworkedMediaFrame.capturedEntity[frameEid],
      newOriginalTargetScale: Array.from(NetworkedMediaFrame.originalTargetScale[frameEid])
    };
    removeComponent(world, NetworkedMediaFrame, frameEid);
    return state;
  }

  if (
    MediaFrame.capturedEntity[frameEid] &&
    !entityExists(world, MediaFrame.capturedEntity[frameEid]) &&
    hasComponent(world, Owned, frameEid)
  ) {
    return { newCapturedEntity: 0, newOriginalTargetScale: [0, 0, 0] };
  }

  if (
    MediaFrame.capturedEntity[frameEid] &&
    hasComponent(world, Owned, MediaFrame.capturedEntity[frameEid]) &&
    !isColliding(world, frameEid, MediaFrame.capturedEntity[frameEid])
  ) {
    return { newCapturedEntity: 0, newOriginalTargetScale: [0, 0, 0] };
  }

  if (!MediaFrame.capturedEntity[frameEid]) {
    const thingToCapture = getCapturableEntity(world, frameEid);
    if (thingToCapture && hasComponent(world, Owned, thingToCapture) && !hasComponent(world, Held, thingToCapture)) {
      const capturableObj = world.eid2obj.get(thingToCapture);
      capturableObj.updateMatrices();
      const newOriginalTargetScale = [0, 0, 0];
      new THREE.Vector3().setFromMatrixScale(capturableObj.matrixWorld).toArray(newOriginalTargetScale);
      return { newCapturedEntity: thingToCapture, newOriginalTargetScale };
    }
  }

  // NO CHANGE!
  return {
    newCapturedEntity: MediaFrame.capturedEntity[frameEid],
    newOriginalTargetScale: Array.from(MediaFrame.originalTargetScale[frameEid])
  };
}

const heldQuery = defineQuery([Held]);
const droppedQuery = exitQuery(heldQuery);
function droppedThisFrame(world, eid) {
  const dropped = droppedQuery(world);
  for (let i = 0; i < dropped.length; i++) {
    if (dropped[i] === eid) return true;
  }
  return false;
}

export function apply(world, frameEid, { newCapturedEntity, newOriginalTargetScale }) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  if (newCapturedEntity === MediaFrame.capturedEntity[frameEid]) {
    // Snap if we dropped the captured thing
    if (
      MediaFrame.capturedEntity[frameEid] &&
      hasComponent(world, Owned, MediaFrame.capturedEntity[frameEid]) &&
      droppedThisFrame(world, MediaFrame.capturedEntity[frameEid])
    ) {
      snapToFrame(
        world,
        frameEid,
        MediaFrame.capturedEntity[frameEid],
        world.eid2obj.get(MediaFrame.capturedEntity[frameEid]).el.getObject3D("mesh")
      );
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[MediaFrame.capturedEntity[frameEid]], { type: "kinematic" });
    }
  } else {
    // Remove the old on if needed
    if (MediaFrame.capturedEntity[frameEid] && entityExists(world, MediaFrame.capturedEntity[frameEid])) {
      setMatrixScale(world.eid2obj.get(MediaFrame.capturedEntity[frameEid]), MediaFrame.originalTargetScale[frameEid]);
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[MediaFrame.capturedEntity[frameEid]], { type: "dynamic" });
    }

    // Capture the new one if needed
    if (newCapturedEntity) {
      takeOwnership(world, frameEid);
      snapToFrame(world, frameEid, newCapturedEntity, world.eid2obj.get(newCapturedEntity).el.getObject3D("mesh"));
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[newCapturedEntity], { type: "kinematic" });
    }
  }

  MediaFrame.capturedEntity[frameEid] = newCapturedEntity;
  MediaFrame.originalTargetScale[frameEid] = newOriginalTargetScale;
}

export function display(world, frameEid, heldMask) {
  // Display the state
  const capturableEid = MediaFrame.capturedEntity[frameEid] || getCapturableEntity(world, frameEid);
  const shouldPreviewBeVisible = capturableEid && hasComponent(world, Held, capturableEid);
  if (shouldPreviewBeVisible && !MediaFrame.preview[frameEid]) showPreview(world, frameEid, capturableEid);
  if (!shouldPreviewBeVisible && MediaFrame.preview[frameEid]) hidePreview(world, frameEid);
  const frameObj = world.eid2obj.get(frameEid);
  frameObj.material.uniforms.color.value.set(
    capturableEid && hasComponent(world, Held, capturableEid)
      ? HOVER_COLOR
      : MediaFrame.capturedEntity[frameEid]
        ? FULL_COLOR
        : EMPTY_COLOR
  );
  frameObj.visible = !!(MediaFrame.mediaType[frameEid] & heldMask);
}

export const mediaFramesSystem = (() => {
  const mediaFramesQuery = defineQuery([MediaFrame]);
  return function mediaFramesSystem(world) {
    const heldEids = heldQuery(world);
    let heldMask = 0;
    for (let i = 0; i < heldEids.length; i++) {
      const eid = heldEids[i];
      heldMask |= mediaTypeMaskFor(world, eid);
    }

    const mediaFrames = mediaFramesQuery(world);
    for (let i = 0; i < mediaFrames.length; i++) {
      const frameEid = mediaFrames[i];

      const state = step(world, frameEid);
      apply(world, frameEid, state);
      display(world, frameEid, heldMask);

      // TODO: Animation mixers should not be handled here
      // Tick animation mixers for preview
      const previewEid = MediaFrame.preview[frameEid];
      // TODO: We need to get the child because the animation mixer is on the mesh, not the parent group
      const mixer = previewEid && world.eid2obj.get(previewEid).children[0].mixer;
      if (mixer) {
        // TODO use dt, not a random number
        mixer.update(10 / 1000);
      }
    }
  };
})();
