import { paths } from "./userinput/paths";
import { SOUND_SNAP_ROTATE, SOUND_WAYPOINT_START, SOUND_WAYPOINT_END } from "./sound-effects-system";
import { easeOutQuadratic } from "../utils/easing";
import { getPooledMatrix4, freePooledMatrix4 } from "../utils/mat4-pool";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import {
  childMatch,
  rotateInPlaceAroundWorldUp,
  calculateCameraTransformForWaypoint,
  interpolateAffine,
  affixToWorldUp
} from "../utils/three-utils";
import { getCurrentPlayerHeight } from "../utils/get-current-player-height";
import qsTruthy from "../utils/qs_truthy";
//import { m4String } from "../utils/pretty-print";
const NAV_ZONE = "character";
const qsAllowWaypointLerp = qsTruthy("waypointLerp");

const calculateDisplacementToDesiredPOV = (function() {
  const translationCoordinateSpace = new THREE.Matrix4();
  const translated = new THREE.Matrix4();
  const localTranslation = new THREE.Matrix4();
  return function calculateDisplacementToDesiredPOV(povMat4, fly, localDisplacement, displacementToDesiredPOV) {
    localTranslation.makeTranslation(localDisplacement.x, localDisplacement.y, localDisplacement.z);
    translationCoordinateSpace.extractRotation(povMat4);
    if (!fly) {
      affixToWorldUp(translationCoordinateSpace, translationCoordinateSpace);
    }
    translated.copy(translationCoordinateSpace).multiply(localTranslation);
    return displacementToDesiredPOV.setFromMatrixPosition(translated);
  };
})();

/**
 * A character controller that moves the avatar.
 * The controller accounts for playspace offset and orientation and depends on the nav mesh system for translation.
 * @namespace avatar
 */
const SNAP_ROTATION_RADIAN = THREE.Math.DEG2RAD * 45;
const BASE_SPEED = 3.2; //TODO: in what units?
export class CharacterControllerSystem {
  constructor(scene) {
    this.scene = scene;
    this.fly = false;
    this.waypoints = [];
    this.waypointTravelStartTime = 0;
    this.waypointTravelTime = 0;
    this.navGroup = null;
    this.navNode = null;
    this.relativeMotion = new THREE.Vector3(0, 0, 0);
    this.nextRelativeMotion = new THREE.Vector3(0, 0, 0);
    this.dXZ = 0;
    this.scene.addEventListener("nav-mesh-loaded", () => {
      this.navGroup = null;
      this.navNode = null;
    });
    waitForDOMContentLoaded().then(() => {
      this.avatarPOV = document.getElementById("avatar-pov-node");
      this.avatarRig = document.getElementById("avatar-rig");
    });
  }
  // Use this API for waypoint travel so that your matrix doesn't end up in the pool
  enqueueWaypointTravelTo(inTransform, isInstant, waypointComponentData) {
    this.waypoints.push({ transform: getPooledMatrix4().copy(inTransform), isInstant, waypointComponentData }); //TODO: don't create new object
  }
  enqueueRelativeMotion(motion) {
    motion.z *= -1;
    this.relativeMotion.add(motion);
  }
  enqueueInPlaceRotationAroundWorldUp(dXZ) {
    this.dXZ += dXZ;
  }
  // We assume the rig is at the root, and its local position === its world position.
  teleportTo = (function() {
    const rig = new THREE.Vector3();
    const head = new THREE.Vector3();
    const deltaFromHeadToTargetForHead = new THREE.Vector3();
    const targetForHead = new THREE.Vector3();
    const targetForRig = new THREE.Vector3();
    //TODO: Use enqueue waypoint
    return function teleportTo(targetWorldPosition) {
      this.isMotionDisabled = false;
      this.avatarRig.object3D.getWorldPosition(rig);
      this.avatarPOV.object3D.getWorldPosition(head);
      targetForHead.copy(targetWorldPosition);
      targetForHead.y += this.avatarPOV.object3D.position.y;
      deltaFromHeadToTargetForHead.copy(targetForHead).sub(head);
      targetForRig.copy(rig).add(deltaFromHeadToTargetForHead);
      this.findPositionOnNavMesh(targetForRig, targetForRig, this.avatarRig.object3D.position);
      this.avatarRig.object3D.matrixNeedsUpdate = true;
    };
  })();

  travelByWaypoint = (function() {
    const inMat4Copy = new THREE.Matrix4();
    const inPosition = new THREE.Vector3();
    const outPosition = new THREE.Vector3();
    const translation = new THREE.Matrix4();
    const initialOrientation = new THREE.Matrix4();
    const finalScale = new THREE.Vector3();
    const finalPosition = new THREE.Vector3();
    const finalPOV = new THREE.Matrix4();
    return function travelByWaypoint(inMat4, snapToNavMesh, willMaintainInitialOrientation) {
      this.avatarPOV.object3D.updateMatrices();
      if (!this.fly && !snapToNavMesh) {
        this.fly = true;
        this.shouldLandWhenPossible = true;
        this.shouldUnoccupyWaypointsOnceMoving = true;
      }
      inMat4Copy.copy(inMat4);
      rotateInPlaceAroundWorldUp(inMat4Copy, Math.PI, finalPOV);
      if (snapToNavMesh) {
        inPosition.setFromMatrixPosition(inMat4Copy);
        this.findPositionOnNavMesh(inPosition, inPosition, outPosition);
        finalPOV.setPosition(outPosition);
        translation.makeTranslation(0, getCurrentPlayerHeight(), -0.15);
      } else {
        translation.makeTranslation(0, 1.6, -0.15);
      }
      finalPOV.multiply(translation);
      if (willMaintainInitialOrientation) {
        initialOrientation.extractRotation(this.avatarPOV.object3D.matrixWorld);
        finalScale.setFromMatrixScale(finalPOV);
        finalPosition.setFromMatrixPosition(finalPOV);
        finalPOV
          .copy(initialOrientation)
          .scale(finalScale)
          .setPosition(finalPosition);
      }
      calculateCameraTransformForWaypoint(this.avatarPOV.object3D.matrixWorld, finalPOV, finalPOV);
      childMatch(this.avatarRig.object3D, this.avatarPOV.object3D, finalPOV);
    };
  })();

  tick = (function() {
    const snapRotatedPOV = new THREE.Matrix4();
    const newPOV = new THREE.Matrix4();
    const displacementToDesiredPOV = new THREE.Vector3();

    const startPOVPosition = new THREE.Vector3();
    const desiredPOVPosition = new THREE.Vector3();
    const navMeshSnappedPOVPosition = new THREE.Vector3();
    const AVERAGE_WAYPOINT_TRAVEL_SPEED_METERS_PER_SECOND = 50;
    const startTransform = new THREE.Matrix4();
    const interpolatedWaypoint = new THREE.Matrix4();
    const startTranslation = new THREE.Matrix4();
    const waypointPosition = new THREE.Vector3();
    const v = new THREE.Vector3();

    return function tick(t, dt) {
      if (!this.scene.is("entered")) return;
      const vrMode = this.scene.is("vr-mode");
      this.sfx = this.sfx || this.scene.systems["hubs-systems"].soundEffectsSystem;
      this.waypointSystem = this.waypointSystem || this.scene.systems["hubs-systems"].waypointSystem;

      if (!this.activeWaypoint && this.waypoints.length) {
        this.activeWaypoint = this.waypoints.splice(0, 1)[0];
        this.isMotionDisabled = this.activeWaypoint.waypointComponentData.willDisableMotion;
        this.isTeleportingDisabled = this.activeWaypoint.waypointComponentData.willDisableTeleporting;
        this.avatarPOV.object3D.updateMatrices();
        this.waypointTravelTime =
          (vrMode && !qsAllowWaypointLerp) || this.activeWaypoint.isInstant
            ? 0
            : 1000 *
              (new THREE.Vector3()
                .setFromMatrixPosition(this.avatarPOV.object3D.matrixWorld)
                .distanceTo(waypointPosition.setFromMatrixPosition(this.activeWaypoint.transform)) /
                AVERAGE_WAYPOINT_TRAVEL_SPEED_METERS_PER_SECOND);
        rotateInPlaceAroundWorldUp(this.avatarPOV.object3D.matrixWorld, Math.PI, startTransform);
        startTransform.multiply(startTranslation.makeTranslation(0, -1 * getCurrentPlayerHeight(), -0.15));
        this.waypointTravelStartTime = t;
        if (!vrMode && this.waypointTravelTime > 100) {
          this.sfx.playSoundOneShot(SOUND_WAYPOINT_START);
        }
      }

      const animationIsOver =
        this.waypointTravelTime === 0 || t >= this.waypointTravelStartTime + this.waypointTravelTime;
      if (this.activeWaypoint && !animationIsOver) {
        const progress = THREE.Math.clamp((t - this.waypointTravelStartTime) / this.waypointTravelTime, 0, 1);
        interpolateAffine(
          startTransform,
          this.activeWaypoint.transform,
          easeOutQuadratic(progress),
          interpolatedWaypoint
        );
        this.travelByWaypoint(
          interpolatedWaypoint,
          false,
          this.activeWaypoint.waypointComponentData.willMaintainInitialOrientation
        );
      }
      if (this.activeWaypoint && (this.waypoints.length || animationIsOver)) {
        this.travelByWaypoint(
          this.activeWaypoint.transform,
          this.activeWaypoint.waypointComponentData.snapToNavMesh,
          this.activeWaypoint.waypointComponentData.willMaintainInitialOrientation
        );
        freePooledMatrix4(this.activeWaypoint.transform);
        this.activeWaypoint = null;
        if (vrMode || this.waypointTravelTime > 0) {
          this.sfx.playSoundOneShot(SOUND_WAYPOINT_END);
        }
      }

      const userinput = AFRAME.scenes[0].systems.userinput;
      if (userinput.get(paths.actions.toggleFly)) {
        this.shouldLandWhenPossible = false;
        this.avatarRig.messageDispatch.dispatch("/fly");
      }
      if (!this.fly && this.shouldLandWhenPossible) {
        this.shouldLandWhenPossible = false;
      }
      if (this.fly) {
        this.navNode = null;
      }
      const snapRotateLeft = userinput.get(paths.actions.snapRotateLeft);
      const snapRotateRight = userinput.get(paths.actions.snapRotateRight);
      if (snapRotateLeft) {
        this.dXZ +=
          window.APP.store.state.preferences.snapRotationDegrees === undefined
            ? SNAP_ROTATION_RADIAN
            : (window.APP.store.state.preferences.snapRotationDegrees * Math.PI) / 180;
      }
      if (snapRotateRight) {
        this.dXZ -=
          window.APP.store.state.preferences.snapRotationDegrees === undefined
            ? SNAP_ROTATION_RADIAN
            : (window.APP.store.state.preferences.snapRotationDegrees * Math.PI) / 180;
      }
      if (snapRotateLeft || snapRotateRight) {
        this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SNAP_ROTATE);
      }
      const characterAcceleration = userinput.get(paths.actions.characterAcceleration);
      if (characterAcceleration) {
        this.relativeMotion.set(
          this.relativeMotion.x + characterAcceleration[0],
          this.relativeMotion.y,
          this.relativeMotion.z + -1 * characterAcceleration[1]
        );
      }
      const lerpC = vrMode ? 0 : 0.85; // TODO: To support drifting ("ice skating"), motion needs to keep initial direction
      this.nextRelativeMotion.copy(this.relativeMotion).multiplyScalar(lerpC);
      this.relativeMotion.multiplyScalar(1 - lerpC);

      this.avatarPOV.object3D.updateMatrices();
      rotateInPlaceAroundWorldUp(this.avatarPOV.object3D.matrixWorld, this.dXZ, snapRotatedPOV);

      const playerScale = v.setFromMatrixColumn(this.avatarPOV.object3D.matrixWorld, 1).length();
      calculateDisplacementToDesiredPOV(
        snapRotatedPOV,
        this.fly,
        this.relativeMotion.multiplyScalar(
          ((userinput.get(paths.actions.boost) ? 2 : 1) * BASE_SPEED * Math.sqrt(playerScale) * dt) / 1000
        ),
        displacementToDesiredPOV
      );
      newPOV
        .makeTranslation(displacementToDesiredPOV.x, displacementToDesiredPOV.y, displacementToDesiredPOV.z)
        .multiply(snapRotatedPOV);
      this.findPOVPositionAboveNavMesh(
        startPOVPosition.setFromMatrixPosition(this.avatarPOV.object3D.matrixWorld),
        desiredPOVPosition.setFromMatrixPosition(newPOV),
        navMeshSnappedPOVPosition
      );
      const triedToMove = displacementToDesiredPOV.lengthSq() > 0.001;
      const squareDistanceToNavSnappedPOVPosition = desiredPOVPosition.distanceToSquared(navMeshSnappedPOVPosition);

      if (this.isMotionDisabled) {
        childMatch(this.avatarRig.object3D, this.avatarPOV.object3D, snapRotatedPOV);
      } else {
        if (
          this.fly &&
          this.shouldLandWhenPossible &&
          triedToMove &&
          squareDistanceToNavSnappedPOVPosition < 0.5 &&
          !this.activeWaypoint
        ) {
          this.shouldLandWhenPossible = false;
          this.fly = false;
          newPOV.setPosition(navMeshSnappedPOVPosition);
        } else if (!this.fly) {
          newPOV.setPosition(navMeshSnappedPOVPosition);
        }
        if (!this.activeWaypoint && this.shouldUnoccupyWaypointsOnceMoving && triedToMove) {
          this.shouldUnoccupyWaypointsOnceMoving = false;
          this.waypointSystem.releaseAnyOccupiedWaypoints();
          if (this.fly && this.shouldLandWhenPossible && squareDistanceToNavSnappedPOVPosition < 3) {
            newPOV.setPosition(navMeshSnappedPOVPosition);
            this.shouldLandWhenPossible = false;
            this.fly = false;
          }
        }
        childMatch(this.avatarRig.object3D, this.avatarPOV.object3D, newPOV);
      }
      this.relativeMotion.copy(this.nextRelativeMotion);
      this.dXZ = 0;
    };
  })();

  getClosestNode(pos) {
    const pathfinder = this.scene.systems.nav.pathfinder;
    if (!pathfinder.zones[NAV_ZONE].groups[this.navGroup]) {
      return null;
    }
    return (
      pathfinder.getClosestNode(pos, NAV_ZONE, this.navGroup, true) ||
      pathfinder.getClosestNode(pos, NAV_ZONE, this.navGroup)
    );
  }

  findPOVPositionAboveNavMesh = (function() {
    const startingFeetPosition = new THREE.Vector3();
    const desiredFeetPosition = new THREE.Vector3();
    return function findPOVPositionAboveNavMesh(startPOVPosition, desiredPOVPosition, outPOVPosition) {
      const playerHeight = getCurrentPlayerHeight(true);
      startingFeetPosition.copy(startPOVPosition);
      startingFeetPosition.y -= playerHeight;
      desiredFeetPosition.copy(desiredPOVPosition);
      desiredFeetPosition.y -= playerHeight;
      this.findPositionOnNavMesh(startingFeetPosition, desiredFeetPosition, outPOVPosition);
      outPOVPosition.y += playerHeight;
      return outPOVPosition;
    };
  })();

  findPositionOnNavMesh(start, end, outPos) {
    const pathfinder = this.scene.systems.nav.pathfinder;
    if (!(NAV_ZONE in pathfinder.zones)) return;
    this.navGroup = pathfinder.getGroup(NAV_ZONE, end, true, true);
    this.navNode = this.getClosestNode(end);
    if (!this.navNode) {
      outPos.copy(end);
    } else {
      this.navNode = pathfinder.clampStep(start, end, this.navNode, NAV_ZONE, this.navGroup, outPos);
    }
    return outPos;
  }
}
