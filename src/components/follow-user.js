import { FollowFov } from "../bit-components";
import { defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { floorMap } from "../bit-systems/map-system";

const objectStates = {};

const followFovQuery = defineQuery([FollowFov]);
const enterFollowFovQuery = enterQuery(followFovQuery);
const exitFollowFovQuery = exitQuery(followFovQuery);

function addObjectToSystem(eid) {
  const objectState = {
    targetObject: null,
    offset: new THREE.Vector3(0, 0, -1.5), // Example offset
    speed: 0.002,
    angle: 20,
    hoveredFrames: 0,
    started: false,
    snappedRot: new THREE.Euler(),
    snappedQ: new THREE.Quaternion(),
    snappedXForm: new THREE.Matrix4(),
    snappedXFormWorld: new THREE.Matrix4(),
    tempVector: new THREE.Vector3(),
    targetPos: new THREE.Vector3()
  };

  // Add the object state to the array.
  objectStates[eid] = objectState;
}

export function followFovSystem(dt) {
  enterFollowFovQuery(APP.world).forEach(enteredEid => {
    addObjectToSystem(enteredEid);
  });

  exitFollowFovQuery(APP.world).forEach(exitedEid => {
    delete objectStates[exitedEid];
  });

  followFovQuery(APP.world).forEach(eid => {
    const eidState = objectStates[eid];
    const obj = APP.world.eid2obj.get(eid);

    const avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
    eidState.targetObject = avatarPovObj;

    let isHovered = false;

    if (!isHovered) {
      eidState.hoveredFrames = 0;
    } else {
      eidState.hoveredFrames += 1;
    }

    _applyMaskedTargetRotation(
      eidState.angle * -1 * THREE.MathUtils.DEG2RAD,
      eidState.targetObject.rotation.y,
      0,
      eidState.snappedXFormWorld,
      eidState
    );

    eidState.targetPos.copy(eidState.offset);
    eidState.targetPos.applyMatrix4(eidState.snappedXFormWorld);

    if (obj.parent) {
      obj.parent.worldToLocal(eidState.targetPos);
    }

    if (!eidState.started) {
      obj.position.copy(eidState.targetPos);
      eidState.started = true;
    } else {
      // Slow down movement if hovering by dampening speed each frame.
      const speed = eidState.hoveredFrames
        ? eidState.speed * (1.0 / ((eidState.hoveredFrames + 5.0) * 0.2))
        : eidState.speed;
      const t = speed * dt;

      obj.position.set(
        obj.position.x + (eidState.targetPos.x - obj.position.x) * t,
        obj.position.y + (eidState.targetPos.y - obj.position.y) * t,
        obj.position.z + (eidState.targetPos.z - obj.position.z) * t
      );
    }

    eidState.snappedXFormWorld.decompose(eidState.tempVector, obj.quaternion, eidState.tempVector);
    obj.matrixNeedsUpdate = true;
  });
}

function _applyMaskedTargetRotation(x, y, z, to, state) {
  const target = state.targetObject;
  state.snappedRot.set(x, y, z, target.rotation.order);
  state.snappedQ.setFromEuler(state.snappedRot);
  state.snappedXForm.compose(target.position, state.snappedQ, target.scale);
  to.multiplyMatrices(target.parent.matrixWorld, state.snappedXForm);
}
