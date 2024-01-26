import { hasComponent, removeEntity } from "bitecs";
import { forEachMaterial } from "./material-utils";

const tempVector3 = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();

export function getLastWorldPosition(src, target) {
  src.updateMatrices();
  target.setFromMatrixPosition(src.matrixWorld);
  return target;
}

export function getLastWorldQuaternion(src, target) {
  src.updateMatrices();
  src.matrixWorld.decompose(tempVector3, target, tempVector3);
  return target;
}

export function getLastWorldScale(src, target) {
  src.updateMatrices();
  src.matrixWorld.decompose(tempVector3, tempQuaternion, target);
  return target;
}

export function disposeMaterial(mtrl) {
  if (mtrl.map) mtrl.map.dispose();
  if (mtrl.lightMap) mtrl.lightMap.dispose();
  if (mtrl.bumpMap) mtrl.bumpMap.dispose();
  if (mtrl.normalMap) mtrl.normalMap.dispose();
  if (mtrl.specularMap) mtrl.specularMap.dispose();
  if (mtrl.envMap) mtrl.envMap.dispose();
  if (mtrl.aoMap) mtrl.aoMap.dispose();
  if (mtrl.metalnessMap) mtrl.metalnessMap.dispose();
  if (mtrl.roughnessMap) mtrl.roughnessMap.dispose();
  if (mtrl.emissiveMap) mtrl.emissiveMap.dispose();
  mtrl.dispose();
  if (mtrl.eid) {
    removeEntity(APP.world, mtrl.eid);
  }
}

export function disposeNode(node) {
  if (!(node instanceof THREE.Mesh)) return;

  if (node.geometry) {
    node.geometry.dispose();
  }

  forEachMaterial(node.material, disposeMaterial);
}

const IDENTITY = new THREE.Matrix4().identity();
const tempMatrix4 = new THREE.Matrix4();
const EPSILON = 0.00000000001;
export function setMatrixWorld(object3D, m) {
  if (!object3D.matrixIsModified) {
    object3D.applyMatrix4(IDENTITY); // hack around our matrix optimizations
  }
  tempMatrix4.copy(object3D.matrixWorld);
  object3D.matrixWorld.copy(m);
  if (object3D.parent) {
    object3D.parent.updateMatrices();
    object3D.matrix.copy(object3D.parent.matrixWorld).invert().multiply(m);
  } else {
    object3D.matrix.copy(m);
  }
  object3D.matrix.decompose(object3D.position, object3D.quaternion, object3D.scale);
  if (tempMatrix4.near(object3D.matrixWorld, EPSILON)) {
    object3D.matrixWorld.copy(tempMatrix4);
  } else {
    object3D.childrenNeedMatrixWorldUpdate = true;
  }
}

// Modified version of Don McCurdy's AnimationUtils.clone
// https://github.com/mrdoob/three.js/pull/14494

function parallelTraverse(a, b, callback) {
  callback(a, b);

  for (let i = 0; i < a.children.length; i++) {
    parallelTraverse(a.children[i], b.children[i], callback);
  }
}

// Supports the following PropertyBinding path formats:
// uuid.propertyName
// uuid.propertyName[propertyIndex]
// uuid.objectName[objectIndex].propertyName[propertyIndex]
// Does not support property bindings that use object3D names or parent nodes
function cloneKeyframeTrack(sourceKeyframeTrack, cloneUUIDLookup) {
  const {
    nodeName: uuid,
    objectName,
    objectIndex,
    propertyName,
    propertyIndex
  } = THREE.PropertyBinding.parseTrackName(sourceKeyframeTrack.name);

  let path = "";

  if (uuid !== undefined) {
    const clonedUUID = cloneUUIDLookup.get(uuid);

    if (clonedUUID === undefined) {
      console.warn(`Could not find KeyframeTrack target with uuid: "${uuid}"`);
    }

    path += clonedUUID;
  }

  if (objectName !== undefined) {
    path += "." + objectName;
  }

  if (objectIndex !== undefined) {
    path += "[" + objectIndex + "]";
  }

  if (propertyName !== undefined) {
    path += "." + propertyName;
  }

  if (propertyIndex !== undefined) {
    path += "[" + propertyIndex + "]";
  }

  const clonedKeyframeTrack = sourceKeyframeTrack.clone();
  clonedKeyframeTrack.name = path;

  return clonedKeyframeTrack;
}

function cloneAnimationClip(sourceAnimationClip, cloneUUIDLookup) {
  const clonedTracks = sourceAnimationClip.tracks.map(keyframeTrack =>
    cloneKeyframeTrack(keyframeTrack, cloneUUIDLookup)
  );
  return new THREE.AnimationClip(sourceAnimationClip.name, sourceAnimationClip.duration, clonedTracks);
}

export function cloneObject3D(source, preserveUUIDs) {
  const cloneLookup = new Map();
  const cloneUUIDLookup = new Map();

  const clone = source.clone();

  parallelTraverse(source, clone, (sourceNode, clonedNode) => {
    cloneLookup.set(sourceNode, clonedNode);

    if (sourceNode.userData.gltfExtensions?.MOZ_hubs_components) {
      clonedNode.userData.gltfExtensions.MOZ_hubs_components = sourceNode.userData.gltfExtensions.MOZ_hubs_components;
    }
  });

  source.traverse(sourceNode => {
    const clonedNode = cloneLookup.get(sourceNode);

    if (preserveUUIDs) {
      clonedNode.uuid = sourceNode.uuid;
    }

    cloneUUIDLookup.set(sourceNode.uuid, clonedNode.uuid);
  });

  source.traverse(sourceNode => {
    const clonedNode = cloneLookup.get(sourceNode);

    if (!clonedNode) {
      return;
    }

    clonedNode.onBeforeRender = sourceNode.onBeforeRender;

    if (sourceNode.animations) {
      clonedNode.animations = sourceNode.animations.map(animationClip =>
        cloneAnimationClip(animationClip, cloneUUIDLookup)
      );
    }

    if (sourceNode.isMesh && sourceNode.geometry.boundsTree) {
      clonedNode.geometry.boundsTree = sourceNode.geometry.boundsTree;
    }

    if ((clonedNode.isDirectionalLight || clonedNode.isSpotLight) && sourceNode.target) {
      clonedNode.target = cloneLookup.get(sourceNode.target);
    }

    if (!sourceNode.isSkinnedMesh) return;

    const sourceBones = sourceNode.skeleton.bones;

    clonedNode.skeleton = sourceNode.skeleton.clone();

    clonedNode.skeleton.bones = sourceBones.map(sourceBone => {
      if (!cloneLookup.has(sourceBone)) {
        throw new Error("Required bones are not descendants of the given object.");
      }

      return cloneLookup.get(sourceBone);
    });

    clonedNode.bind(clonedNode.skeleton, sourceNode.bindMatrix);
  });

  return clone;
}

export function findNode(root, pred) {
  let nodes = [root];
  while (nodes.length) {
    const node = nodes.shift();
    if (pred(node)) return node;
    if (node.children) nodes = nodes.concat(node.children);
  }
  return null;
}

export const interpolateAffine = (function () {
  const mat4 = new THREE.Matrix4();
  const end = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3()
  };
  const start = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3()
  };
  const interpolated = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3()
  };
  return function (startMat4, endMat4, progress, outMat4) {
    start.quaternion.setFromRotationMatrix(mat4.extractRotation(startMat4));
    end.quaternion.setFromRotationMatrix(mat4.extractRotation(endMat4));
    interpolated.quaternion.slerpQuaternions(start.quaternion, end.quaternion, progress);
    interpolated.position.lerpVectors(
      start.position.setFromMatrixColumn(startMat4, 3),
      end.position.setFromMatrixColumn(endMat4, 3),
      progress
    );
    interpolated.scale.lerpVectors(
      start.scale.setFromMatrixScale(startMat4),
      end.scale.setFromMatrixScale(endMat4),
      progress
    );
    return outMat4.compose(interpolated.position, interpolated.quaternion, interpolated.scale);
  };
})();

export const squareDistanceBetween = (function () {
  const posA = new THREE.Vector3();
  const posB = new THREE.Vector3();
  return function (objA, objB) {
    objA.updateMatrices();
    objB.updateMatrices();
    posA.setFromMatrixColumn(objA.matrixWorld, 3);
    posB.setFromMatrixColumn(objB.matrixWorld, 3);
    return posA.distanceToSquared(posB);
  };
})();

export function isAlmostUniformVector3(v, epsilonHalf = 0.005) {
  return Math.abs(v.x - v.y) < epsilonHalf && Math.abs(v.x - v.z) < epsilonHalf;
}
export function almostEqual(a, b, epsilon = 0.01) {
  return Math.abs(a - b) < epsilon;
}

export const affixToWorldUp = (function () {
  const inRotationMat4 = new THREE.Matrix4();
  const inForward = new THREE.Vector3();
  const outForward = new THREE.Vector3();
  const outSide = new THREE.Vector3();
  const worldUp = new THREE.Vector3(); // Could be called "outUp"
  const v = new THREE.Vector3();
  const inMat4Copy = new THREE.Matrix4();
  return function affixToWorldUp(inMat4, outMat4) {
    inRotationMat4.identity().extractRotation(inMat4Copy.copy(inMat4));
    inForward.setFromMatrixColumn(inRotationMat4, 2).multiplyScalar(-1);
    outForward
      .copy(inForward)
      .sub(v.copy(inForward).projectOnVector(worldUp.set(0, 1, 0)))
      .normalize();
    outSide.crossVectors(outForward, worldUp);
    outMat4.makeBasis(outSide, worldUp, outForward.multiplyScalar(-1));
    outMat4.scale(v.setFromMatrixScale(inMat4Copy));
    outMat4.setPosition(v.setFromMatrixColumn(inMat4Copy, 3));
    return outMat4;
  };
})();

export const calculateCameraTransformForWaypoint = (function () {
  const upAffixedCameraTransform = new THREE.Matrix4();
  const upAffixedWaypointTransform = new THREE.Matrix4();
  const detachFromWorldUp = new THREE.Matrix4();
  return function calculateCameraTransformForWaypoint(cameraTransform, waypointTransform, outMat4) {
    affixToWorldUp(cameraTransform, upAffixedCameraTransform);
    detachFromWorldUp.copy(upAffixedCameraTransform).invert().multiply(cameraTransform);
    affixToWorldUp(waypointTransform, upAffixedWaypointTransform);
    outMat4.copy(upAffixedWaypointTransform).multiply(detachFromWorldUp);
  };
})();

export const calculateViewingDistance = (function () {
  return function calculateViewingDistance(fov, aspect, box, center, vrMode) {
    const halfYExtents = Math.max(Math.abs(box.max.y - center.y), Math.abs(center.y - box.min.y));
    const halfXExtents = Math.max(Math.abs(box.max.x - center.x), Math.abs(center.x - box.min.x));
    const halfVertFOV = THREE.MathUtils.degToRad(fov / 2);
    const halfHorFOV = Math.atan(Math.tan(halfVertFOV) * aspect) * (vrMode ? 0.5 : 1);
    const margin = 1.05;
    const length1 = Math.abs((halfYExtents * margin) / Math.tan(halfVertFOV));
    const length2 = Math.abs((halfXExtents * margin) / Math.tan(halfHorFOV));
    const length3 = Math.abs(box.max.z - center.z) + Math.max(length1, length2);
    const length = vrMode ? Math.max(0.25, length3) : length3;
    return length || 1.25;
  };
})();

export const rotateInPlaceAroundWorldUp = (function () {
  const inMat4Copy = new THREE.Matrix4();
  const startRotation = new THREE.Matrix4();
  const endRotation = new THREE.Matrix4();
  const v = new THREE.Vector3();
  return function rotateInPlaceAroundWorldUp(inMat4, theta, outMat4) {
    inMat4Copy.copy(inMat4);
    return outMat4
      .copy(endRotation.makeRotationY(theta).multiply(startRotation.extractRotation(inMat4Copy)))
      .scale(v.setFromMatrixScale(inMat4Copy))
      .setPosition(v.setFromMatrixPosition(inMat4Copy));
  };
})();

export const childMatch = (function () {
  const inverseParentWorld = new THREE.Matrix4();
  const childRelativeToParent = new THREE.Matrix4();
  const childInverse = new THREE.Matrix4();
  const newParentMatrix = new THREE.Matrix4();
  // transform the parent such that its child matches the target
  return function childMatch(parent, child, target) {
    parent.updateMatrices();
    inverseParentWorld.copy(parent.matrixWorld).invert();
    child.updateMatrices();
    childRelativeToParent.multiplyMatrices(inverseParentWorld, child.matrixWorld);
    childInverse.copy(childRelativeToParent).invert();
    newParentMatrix.multiplyMatrices(target, childInverse);
    setMatrixWorld(parent, newParentMatrix);
  };
})();

export function createPlaneBufferGeometry(width, height, widthSegments, heightSegments, flipY = true) {
  const geometry = new THREE.PlaneBufferGeometry(width, height, widthSegments, heightSegments);
  // Three.js seems to assume texture flipY is true for all its built in geometry
  // but we turn this off on our texture loader since createImageBitmap in Firefox
  // does not support flipping. Then we flip the uv for flipY = false texture.
  if (flipY === false) {
    const uv = geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, 1.0 - uv.getY(i));
    }
  }
  return geometry;
}

import { Layers } from "../camera-layers";
import { Box3, DoubleSide, Group, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { TEXTURES_FLIP_Y } from "../loaders/HubsTextureLoader";
import { MediaVideo } from "../bit-components";
import { Text } from "troika-three-text";

// This code is from three-vrm. We will likely be using that in the future and this inlined code can go away
function excludeTriangles(triangles, bws, skinIndex, exclude) {
  let count = 0;
  if (bws != null && bws.length > 0) {
    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i];
      const b = triangles[i + 1];
      const c = triangles[i + 2];
      const bw0 = bws[a];
      const skin0 = skinIndex[a];

      if (bw0[0] > 0 && exclude.includes(skin0[0])) continue;
      if (bw0[1] > 0 && exclude.includes(skin0[1])) continue;
      if (bw0[2] > 0 && exclude.includes(skin0[2])) continue;
      if (bw0[3] > 0 && exclude.includes(skin0[3])) continue;

      const bw1 = bws[b];
      const skin1 = skinIndex[b];
      if (bw1[0] > 0 && exclude.includes(skin1[0])) continue;
      if (bw1[1] > 0 && exclude.includes(skin1[1])) continue;
      if (bw1[2] > 0 && exclude.includes(skin1[2])) continue;
      if (bw1[3] > 0 && exclude.includes(skin1[3])) continue;

      const bw2 = bws[c];
      const skin2 = skinIndex[c];
      if (bw2[0] > 0 && exclude.includes(skin2[0])) continue;
      if (bw2[1] > 0 && exclude.includes(skin2[1])) continue;
      if (bw2[2] > 0 && exclude.includes(skin2[2])) continue;
      if (bw2[3] > 0 && exclude.includes(skin2[3])) continue;

      triangles[count++] = a;
      triangles[count++] = b;
      triangles[count++] = c;
    }
  }
  return count;
}

function createErasedMesh(src, erasingBonesIndex) {
  const dst = new THREE.SkinnedMesh(src.geometry.clone(), src.material);
  dst.name = `${src.name}(headless)`;
  dst.frustumCulled = src.frustumCulled;
  dst.layers.set(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);

  const geometry = dst.geometry;

  const skinIndexAttr = geometry.getAttribute("skinIndex").array;
  const skinIndex = [];
  for (let i = 0; i < skinIndexAttr.length; i += 4) {
    skinIndex.push([skinIndexAttr[i], skinIndexAttr[i + 1], skinIndexAttr[i + 2], skinIndexAttr[i + 3]]);
  }

  const skinWeightAttr = geometry.getAttribute("skinWeight").array;
  const skinWeight = [];
  for (let i = 0; i < skinWeightAttr.length; i += 4) {
    skinWeight.push([skinWeightAttr[i], skinWeightAttr[i + 1], skinWeightAttr[i + 2], skinWeightAttr[i + 3]]);
  }

  const index = geometry.getIndex();
  if (!index) {
    throw new Error("The geometry doesn't have an index buffer");
  }
  const oldTriangles = Array.from(index.array);

  const count = excludeTriangles(oldTriangles, skinWeight, skinIndex, erasingBonesIndex);
  const newTriangle = [];
  for (let i = 0; i < count; i++) {
    newTriangle[i] = oldTriangles[i];
  }
  geometry.setIndex(newTriangle);

  if (src.onBeforeRender) {
    dst.onBeforeRender = src.onBeforeRender;
  }

  dst.bind(new THREE.Skeleton(src.skeleton.bones, src.skeleton.boneInverses), new THREE.Matrix4());

  return dst;
}

function isEraseTarget(bone) {
  return bone.name === "Head" || (bone.parent && isEraseTarget(bone.parent));
}

export function createHeadlessModelForSkinnedMesh(mesh) {
  const eraseBoneIndexes = [];
  mesh.skeleton.bones.forEach((bone, index) => {
    if (isEraseTarget(bone)) eraseBoneIndexes.push(index);
  });

  if (!eraseBoneIndexes.length) {
    mesh.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    mesh.layers.enable(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);
    return;
  }

  mesh.layers.set(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);

  return createErasedMesh(mesh, eraseBoneIndexes);
}

export const isFacingCamera = (function () {
  const objWorldDir = new THREE.Vector3();
  const objWorld = new THREE.Vector3();
  const camWorld = new THREE.Vector3();
  return function isFacingCamera(obj) {
    const playerCamera = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.viewingCamera;
    playerCamera.getWorldPosition(camWorld);
    obj.getWorldPosition(objWorld);
    obj.getWorldDirection(objWorldDir);
    return objWorldDir.dot(objWorld.sub(camWorld)) < 0;
  };
})();

export function findAncestor(obj, predicate) {
  let ancestor = obj;
  while (ancestor) {
    if (predicate(ancestor)) return ancestor;
    ancestor = ancestor.parent;
  }
  return null;
}

export function findAncestors(obj, predicate) {
  const ancestors = [];
  let ancestor = obj;
  while (ancestor) {
    if (predicate(ancestor)) ancestors.push(ancestor);
    ancestor = ancestor.parent;
  }
  return ancestors;
}

export function traverseSome(obj, fn) {
  const shouldContinue = fn(obj);
  if (shouldContinue) {
    for (let i = 0; i < obj.children.length; i++) {
      traverseSome(obj.children[i], fn);
    }
  }
}

const expandByObject = (function () {
  const _box = new Box3();
  const _vector = new Vector3();
  return function expandByObject(box, object, onlyVisible = true, precise = false) {
    // Computes the world-axis-aligned bounding box of an object (including its children),
    // accounting for both the object's, and children's, world transforms

    object.updateWorldMatrix(false, false);

    if (object.boundingBox !== undefined) {
      if (object.boundingBox === null) {
        object.computeBoundingBox();
      }

      _box.copy(object.boundingBox);
      _box.applyMatrix4(object.matrixWorld);

      box.union(_box);
    } else {
      const geometry = object.geometry;

      if (geometry !== undefined) {
        if (precise && geometry.attributes !== undefined && geometry.attributes.position !== undefined) {
          const position = geometry.attributes.position;
          for (let i = 0, l = position.count; i < l; i++) {
            _vector.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
            box.expandByPoint(_vector);
          }
        } else {
          if (geometry.boundingBox === null) {
            geometry.computeBoundingBox();
          }

          _box.copy(geometry.boundingBox);
          _box.applyMatrix4(object.matrixWorld);

          box.union(_box);
        }
      }
    }

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {
      if (onlyVisible && !children[i].visible) {
        continue;
      } else {
        expandByObject(box, children[i], onlyVisible, precise);
      }
    }
  };
})();

export function setFromObject(box, object, onlyVisible = true, precise = false) {
  box.makeEmpty();
  expandByObject(box, object, onlyVisible, precise);
}

const videoGeometry = createPlaneBufferGeometry(1, 1, 1, 1, TEXTURES_FLIP_Y);
const previewMaterial = new MeshBasicMaterial();
previewMaterial.side = DoubleSide;
previewMaterial.transparent = true;
previewMaterial.opacity = 0.5;
THREE.Object3D.prototype._clone = THREE.Object3D.prototype.clone;
THREE.Object3D.prototype.clone = (function () {
  return function clone() {
    if (this.type === "Audio") {
      console.log("Audio clone not supported");
      return new Object3D();
    } else if (hasComponent(APP.world, MediaVideo, this.eid)) {
      const videoMesh = new Mesh(videoGeometry, previewMaterial);
      videoMesh.material.map = this.material.map;
      videoMesh.material.needsUpdate = true;
      // Preview mesh UVs are set to accommodate textureLoader default, but video textures don't match this
      const aspectRatio = MediaVideo.ratio[this.eid];
      videoMesh.scale.setY(TEXTURES_FLIP_Y !== videoMesh.material.map.flipY ? -aspectRatio : aspectRatio);
      videoMesh.matrixNeedsUpdate = true;

      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        videoMesh.add(child.clone());
      }

      return videoMesh;
    } else if (this.type === "Group") {
      const group = new Group().copy(this, false);
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        // Troika text material crashes when cloning: https://github.com/protectwise/troika/issues/248
        // Ignoring for now...
        if (child instanceof Text) {
          group.add(new Object3D());
        } else {
          group.add(child.clone());
        }
      }
      return group;
    } else {
      return this._clone();
    }
  };
})();
