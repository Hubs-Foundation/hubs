import { addObject3DComponent, MediaFrame, MediaFramePreviewClone, Held, Rigidbody } from "../utils/jsx-entity";
import { addEntity, defineComponent, defineQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { MediaType } from "../utils/media-utils";
import { cloneObject3D, setMatrixWorld } from "../utils/three-utils";

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

function releaseFromFrame(world, frameEid) {
  const targetEid = MediaFrame.target[frameEid];
  MediaFrame.target[frameEid] = 0;
  if (!entityExists(world, targetEid)) return;

  const targetObj = world.eid2obj.get(targetEid);
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  targetObj.updateMatrices();
  targetObj.matrixWorld.decompose(position, quaternion, scale);
  const m4 = new THREE.Matrix4();
  setMatrixWorld(
    targetObj,
    m4.compose(
      position,
      quaternion,
      scale.fromArray(MediaFrame.originalTargetScale[frameEid])
    )
  );

  // If anything reads this without resetting it, it's a BIG problem ;)
  MediaFrame.originalTargetScale[frameEid].set([20, 20, 20]);

  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateBodyOptions(Rigidbody.bodyId[targetEid], { type: "dynamic" });
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

export const mediaFramesSystem = (() => {
  const heldQuery = defineQuery([Held]);
  const droppedQuery = exitQuery(heldQuery);
  function droppedThisFrame(world, eid) {
    const dropped = droppedQuery(world);
    for (let i = 0; i < dropped.length; i++) {
      if (dropped[i] === eid) return true;
    }
    return false;
  }

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
      const frameObj = world.eid2obj.get(frameEid);
      frameObj.visible = !!(MediaFrame.mediaType[frameEid] & heldMask);
      const targetEid = MediaFrame.target[frameEid];
      if (targetEid) {
        if (MediaFrame.preview[frameEid]) {
          hidePreview(world, frameEid);
        }
        frameObj.material.uniforms.color.value.set(FULL_COLOR);
        if (isColliding(world, frameEid, targetEid)) {
          if (hasComponent(world, Held, targetEid)) {
            frameObj.material.uniforms.color.value.set(HOVER_COLOR);
            // TODO: This is different from the original behavior. Should we show preview in this case or not?
            if (!MediaFrame.preview[frameEid]) showPreview(world, frameEid, targetEid);
          } else if (droppedThisFrame(world, targetEid)) {
            console.log("should resnap");
            snapToFrame(world, frameEid, targetEid, world.eid2obj.get(targetEid).el.getObject3D("mesh"));
            const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
            physicsSystem.updateBodyOptions(Rigidbody.bodyId[targetEid], { type: "kinematic" });
          }
        } else {
          releaseFromFrame(world, frameEid);
          console.log("release!");
        }
      } else {
        frameObj.material.uniforms.color.value.set(EMPTY_COLOR);
        const capturableEid = getCapturableEntity(world, frameEid);
        if (capturableEid) {
          // TODO We should be checking a "isManipulating" flag compoennt instead of "Held".
          //      Constraint system, rotation, scale would all add the flag
          if (hasComponent(world, Held, capturableEid)) {
            frameObj.material.uniforms.color.value.set(HOVER_COLOR);
            if (!MediaFrame.preview[frameEid]) showPreview(world, frameEid, capturableEid);
          } else {
            console.log("capture!");
            MediaFrame.target[frameEid] = capturableEid;
            const capturableObj = world.eid2obj.get(capturableEid);
            capturableObj.updateMatrices();
            const scale = new THREE.Vector3().setFromMatrixScale(capturableObj.matrixWorld);
            MediaFrame.originalTargetScale[frameEid].set([scale.x, scale.y, scale.z]);
            snapToFrame(world, frameEid, capturableEid, world.eid2obj.get(capturableEid).el.getObject3D("mesh"));
            const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
            physicsSystem.updateBodyOptions(Rigidbody.bodyId[capturableEid], { type: "kinematic" });
          }
        } else {
          if (MediaFrame.preview[frameEid]) hidePreview(world, frameEid);
        }
      }

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
