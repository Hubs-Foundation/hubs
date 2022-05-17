// https://dev.reticulum.io/scenes/7vGnzkM/outdoor-meetup
// A scene with media-frames
import { addObject3DComponent, MediaFramePreviewClone, Held, Rigidbody } from "../utils/jsx-entity";
import { MediaType } from "../utils/media-utils";
import { addComponent, addEntity, defineComponent, defineQuery, entityExists, exitQuery, hasComponent } from "bitecs";
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

function isAncestor(a, b) {
  let ancestor = b.parent;
  while (ancestor) {
    if (ancestor === a) return true;
    ancestor = ancestor.parent;
  }
  return false;
}

function getCapturableEntity(world, frame) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[frame]);
  const frameObj = world.eid2obj.get(frame);
  for (let i = 0; i < collisions.length; i++) {
    const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
    if (
      MediaFrame.mediaType[frame] & mediaTypeMaskFor(world, bodyData.object3D.eid) &&
      !isAncestor(bodyData.object3D, frameObj)
    ) {
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
  // because in the case of the preview the target eid is associated with the mesh,
  // but in the case of snapping the object, the target eid is associated with a parent of the mesh,
  // which also has children (including menu objects).
  return function snapToFrame(world, frame, target, meshToFit) {
    const frameObj = world.eid2obj.get(frame);
    const targetObj = world.eid2obj.get(target);
    frameObj.updateMatrices();
    targetObj.updateMatrices();

    frameObj.matrixWorld.decompose(framePos, frameQuat, frameScale);
    targetObj.matrixWorld.decompose(targetPos, targetQuat, targetScale);

    setMatrixWorld(
      targetObj,
      m4.compose(
        targetPos,
        frameQuat.identity(), // Reset rotation for correct box calculation
        targetScale
      )
    );

    // TODO: BUG Why do we have to traverse the mesh and update all the matrices?
    //           Does box.setFromObject not correctly account for out-of-date matrices?
    meshToFit.traverse(o => o.updateMatrices());

    // TODO: Why doesn't updating the mesh alone work?
    // meshToFit.updateMatrices();

    // TODO: Why doesn't updating the target object alone work?
    // targetObj.updateMatrices();

    setMatrixWorld(
      targetObj,
      m4.compose(
        targetPos.copy(framePos),
        targetQuat.copy(frameQuat),
        targetScale.multiplyScalar(
          scaleForAspectFit(MediaFrame.bounds[frame], box.setFromObject(meshToFit).getSize(size))
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

  const clone = addEntity(world);
  addObject3DComponent(world, clone, cloneObj);
  // TODO Aframe
  AFRAME.scenes[0].object3D.add(cloneObj);
  return clone;
}

// TODO: If the preview is created while loading, then we just cached a loading cube clone
function showPreview(world, frame, capturable) {
  let clone = MediaFramePreviewClone.preview[capturable];
  if (!clone) {
    clone = cloneForPreview(world, capturable);
    MediaFramePreviewClone.preview[capturable] = clone;
  }
  const cloneObj = world.eid2obj.get(clone);
  cloneObj.visible = true;
  MediaFrame.preview[frame] = clone;
  snapToFrame(world, frame, clone, cloneObj);

  // If there is a mixer, we need to re-sync the animations
  const meshClone = cloneObj.children[0];
  if (meshClone.mixer) {
    const capturableObj = world.eid2obj.get(capturable);
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

function hidePreview(world, frame) {
  const previewObj = world.eid2obj.get(MediaFrame.preview[frame]);
  if (previewObj.mixer) {
    previewObj.mixer.stopAllAction();
    previewObj.mixer.uncacheRoot(previewObj);
  }

  // TODO: Remove from scene graph?
  previewObj.visible = false;
  MediaFrame.preview[frame] = 0;
}

const zero = [0, 0, 0];
const vec3 = new THREE.Vector3();

export function display(world, frame, heldMediaTypes) {
  // Display the state
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
    const captured = world.nid2eid.get(world.sid2str.get(MediaFrame.capturedNid[frame])) || 0;
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

const heldQuery = defineQuery([Held]);
const droppedQuery = exitQuery(heldQuery);
const mediaFramesQuery = defineQuery([MediaFrame]);
export function mediaFramesSystem(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const heldMediaTypes = mediaTypesOf(world, heldQuery(world));
  const droppedEntities = droppedQuery(world);
  const mediaFrames = mediaFramesQuery(world);

  for (let i = 0; i < mediaFrames.length; i++) {
    const frame = mediaFrames[i];

    const captured = world.nid2eid.get(world.sid2str.get(MediaFrame.capturedNid[frame])) || 0;

    if (captured && hasComponent(world, Owned, captured) && droppedEntities.includes(captured)) {
      snapToFrame(world, frame, captured, world.eid2obj.get(captured).el.getObject3D("mesh"));
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[captured], { type: "kinematic" });
    } else if (
      (hasComponent(world, Owned, frame) &&
        MediaFrame.capturedNid[frame] &&
        world.deletedNids.has(MediaFrame.capturedNid[frame])) ||
      (captured && hasComponent(world, Owned, captured) && !isColliding(world, frame, captured))
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
      if (capturable && hasComponent(world, Owned, capturable) && !hasComponent(world, Held, capturable)) {
        takeOwnership(world, frame);
        NetworkedMediaFrame.capturedNid[frame] = world.str2sid.get(world.eid2nid.get(capturable));
        const obj = world.eid2obj.get(capturable);
        obj.updateMatrices();
        vec3.setFromMatrixScale(obj.matrixWorld).toArray(NetworkedMediaFrame.scale[frame]);
        snapToFrame(world, frame, capturable, world.eid2obj.get(capturable).el.getObject3D("mesh"));
        physicsSystem.updateBodyOptions(Rigidbody.bodyId[capturable], { type: "kinematic" });
      }
    }

    if (
      NetworkedMediaFrame.capturedNid[frame] !== MediaFrame.capturedNid[frame] &&
      (captured && entityExists(world, captured) && hasComponent(world, Owned, captured))
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
