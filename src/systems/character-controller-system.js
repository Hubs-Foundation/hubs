import { paths } from "./userinput/paths";
import { SOUND_SNAP_ROTATE, SOUND_TELEPORT_END } from "./sound-effects-system";
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
//import { m4String } from "../utils/pretty-print";
const NAV_ZONE = "character";

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
const BASE_SPEED = 2.9; //TODO: in what units?
export class CharacterControllerSystem {
  constructor(scene) {
    this.scene = scene;
    this.fly = false;
    this.enqueueRelativeMotion = this.enqueueRelativeMotion.bind(this);
    this.enqueueInPlaceRotationAroundWorldUp = this.enqueueInPlaceRotationAroundWorldUp.bind(this);
    this.findPOVPositionAboveNavMesh = this.findPOVPositionAboveNavMesh.bind(this); //TODO: need this?
    this.tick = this.tick.bind(this); //TODO: need this?
    this.waypoints = [];
    this.prevWaypointTravelTime = 0;
    this.waypointTravelTime = 0;
    this.navGroup = null;
    this.navNode = null;
    this.relativeMotion = new THREE.Vector3(0, 0, 0);
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
  enqueueWaypointTravelTo(inMat4, isInstant) {
    this.waypoints.push({ waypoint: getPooledMatrix4().copy(inMat4), isInstant }); //TODO: don't create new object
  }
  enqueueRelativeMotion(motion) {
    this.relativeMotion.add(motion);
  }
  enqueueInPlaceRotationAroundWorldUp(dXZ) {
    this.dXZ += dXZ;
  }
  // We assume the rig is at the root, and its local position === its world position.
  //TODO: Use enqueue waypoint
  teleportTo = (function() {
    const rig = new THREE.Vector3();
    const head = new THREE.Vector3();
    const deltaFromHeadToTargetForHead = new THREE.Vector3();
    const targetForHead = new THREE.Vector3();
    const targetForRig = new THREE.Vector3();
    return function teleportTo(targetWorldPosition) {
      this.isMovementDisabled = false;
      const o = this.avatarRig.object3D;
      o.getWorldPosition(rig);
      this.avatarPOV.object3D.getWorldPosition(head);
      targetForHead.copy(targetWorldPosition);
      targetForHead.y += this.avatarPOV.object3D.position.y;
      deltaFromHeadToTargetForHead.copy(targetForHead).sub(head);
      targetForRig.copy(rig).add(deltaFromHeadToTargetForHead);

      const pathfinder = this.scene.systems.nav.pathfinder;
      this.navGroup = pathfinder.getGroup(NAV_ZONE, targetForRig, true, true);
      this.navNode = null;
      this._setNavNode(targetForRig);
      pathfinder.clampStep(rig, targetForRig, this.navNode, NAV_ZONE, this.navGroup, o.position);
      o.matrixNeedsUpdate = true;
    };
  })();

  travelByWaypoint = (function() {
    const final = new THREE.Matrix4();
    const translatedUp = new THREE.Matrix4();
    return function travelByWaypoint(inMat4) {
      if (!this.fly) {
        this.avatarRig.messageDispatch.dispatch("/fly");
        this.shouldLandWhenPossible = true;
        this.shouldUnoccupyWaypointsOnceMoving = true;
      }
      translatedUp.copy(inMat4);
      // TODO: Have to move forward a little too for center-object to center-eye difference
      translatedUp.elements[13] += getCurrentPlayerHeight(); // Waypoints are placed at your feet
      rotateInPlaceAroundWorldUp(translatedUp, Math.PI, translatedUp); // Waypoints are backwards
      translatedUp.multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.25)); // head-to-eye
      this.avatarPOV.object3D.updateMatrices();
      calculateCameraTransformForWaypoint(this.avatarPOV.object3D.matrixWorld, translatedUp, final);
      childMatch(this.avatarRig.object3D, this.avatarPOV.object3D, final);
    };
  })();

  tick = (function() {
    const snapRotatedPOV = new THREE.Matrix4();
    const newPOV = new THREE.Matrix4();
    const displacementToDesiredPOV = new THREE.Vector3();

    const startPOVPosition = new THREE.Vector3();
    const desiredPOVPosition = new THREE.Vector3();
    const navMeshSnappedPOVPosition = new THREE.Vector3();
    const initialScale = new THREE.Vector3();
    const AVERAGE_WAYPOINT_TRAVEL_SPEED_METERS_PER_SECOND = 50;

    return function tick(t, dt) {
      if (!this.scene.is("entered")) return;
      const vrMode = this.scene.is("vr-mode");
      this.sfx = this.sfx || this.scene.systems["hubs-systems"].soundEffectsSystem;
      this.waypointSystem = this.waypointSystem || this.scene.systems["hubs-systems"].waypointSystem;

      initialScale.copy(this.avatarRig.object3D.scale);

      if (!this.activeWaypoint && this.waypoints.length) {
        const { waypoint, isInstant } = this.waypoints.splice(0, 1)[0];
        this.activeWaypoint = waypoint;
        this.avatarPOV.object3D.updateMatrices();
        this.waypointTravelTime =
          vrMode || isInstant
            ? 0
            : 1000 *
              (new THREE.Vector3()
                .setFromMatrixPosition(this.avatarPOV.object3D.matrixWorld)
                .distanceTo(new THREE.Vector3().setFromMatrixPosition(waypoint)) /
                AVERAGE_WAYPOINT_TRAVEL_SPEED_METERS_PER_SECOND);
        this.startPoint = new THREE.Matrix4().copy(this.avatarPOV.object3D.matrixWorld);
        this.startPoint.elements[0] *= -1;
        this.startPoint.elements[1] *= -1;
        this.startPoint.elements[2] *= -1;
        this.startPoint.elements[3] *= -1;
        this.startPoint.elements[8] *= -1;
        this.startPoint.elements[9] *= -1;
        this.startPoint.elements[10] *= -1;
        this.startPoint.elements[11] *= -1;
        this.startPoint.elements[13] -= getCurrentPlayerHeight();
        this.prevWaypointTravelTime = t;
        if (!vrMode && this.waypointTravelTime > 0) {
          this.sfx.playSoundOneShot(SOUND_SNAP_ROTATE);
        }
      }

      const animationIsOver =
        this.waypointTravelTime === 0 || t >= this.prevWaypointTravelTime + this.waypointTravelTime;
      if (this.activeWaypoint && !animationIsOver) {
        const progress = THREE.Math.clamp((t - this.prevWaypointTravelTime) / this.waypointTravelTime, 0, 1);
        const interpolatedWaypoint = interpolateAffine(
          this.startPoint,
          this.activeWaypoint,
          easeOutQuadratic(progress),
          new THREE.Matrix4()
        );
        this.travelByWaypoint(interpolatedWaypoint);
      }
      if (this.activeWaypoint && (this.waypoints.length || animationIsOver)) {
        this.travelByWaypoint(this.activeWaypoint);
        freePooledMatrix4(this.activeWaypoint);
        this.activeWaypoint = null;
        if (vrMode || this.waypointTravelTime > 0) {
          this.sfx.playSoundOneShot(SOUND_TELEPORT_END);
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
      const snapRotateLeft = userinput.get(paths.actions.snapRotateLeft);
      const snapRotateRight = userinput.get(paths.actions.snapRotateRight);
      if (snapRotateLeft) {
        this.dXZ += SNAP_ROTATION_RADIAN;
      }
      if (snapRotateRight) {
        this.dXZ -= SNAP_ROTATION_RADIAN;
      }
      if (snapRotateLeft || snapRotateRight) {
        this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SNAP_ROTATE);
      }
      const characterAcceleration = userinput.get(paths.actions.characterAcceleration);
      if (characterAcceleration) {
        this.relativeMotion.set(
          this.relativeMotion.x + characterAcceleration[0],
          this.relativeMotion.y,
          -1 * (this.relativeMotion.z + characterAcceleration[1])
        );
      }
      this.avatarPOV.object3D.updateMatrices();
      rotateInPlaceAroundWorldUp(this.avatarPOV.object3D.matrixWorld, this.dXZ, snapRotatedPOV);
      calculateDisplacementToDesiredPOV(
        snapRotatedPOV,
        this.fly,
        this.relativeMotion.multiplyScalar(((userinput.get(paths.actions.boost) ? 2 : 1) * BASE_SPEED * dt) / 1000),
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
      if (
        this.fly &&
        this.shouldLandWhenPossible &&
        triedToMove &&
        squareDistanceToNavSnappedPOVPosition < 0.5 &&
        !this.activeWaypoint
      ) {
        this.shouldLandWhenPossible = false;
        this.avatarRig.messageDispatch.dispatch("/fly");
        newPOV.setPosition(navMeshSnappedPOVPosition);
      } else if (!this.fly) {
        newPOV.setPosition(navMeshSnappedPOVPosition);
      }
      if (!this.activeWaypoint && this.shouldUnoccupyWaypointsOnceMoving && triedToMove) {
        this.shouldUnoccupyWaypointsOnceMoving = false;
        this.waypointSystem.releaseAnyOccupiedWaypoints();
        if (this.fly && this.shouldLandWhenPossible && squareDistanceToNavSnappedPOVPosition < 2) {
          newPOV.setPosition(navMeshSnappedPOVPosition);
          this.shouldLandWhenPossible = false;
          this.avatarRig.messageDispatch.dispatch("/fly");
        }
      }
      childMatch(this.avatarRig.object3D, this.avatarPOV.object3D, newPOV);
      this.avatarRig.object3D.scale.copy(initialScale);
      this.relativeMotion.set(0, 0, 0);
      this.dXZ = 0;
    };
  })();

  _setNavNode(pos) {
    if (this.navNode !== null) return;
    const { pathfinder } = this.scene.systems.nav;
    this.navNode =
      pathfinder.getClosestNode(pos, NAV_ZONE, this.navGroup, true) ||
      pathfinder.getClosestNode(pos, NAV_ZONE, this.navGroup);
  }

  findPOVPositionAboveNavMesh = (function() {
    const startingFeetPosition = new THREE.Vector3();
    const desiredFeetPosition = new THREE.Vector3();
    return function findPOVPositionAboveNavMesh(startPOVPosition, desiredPOVPosition, outPOVPosition) {
      const playerHeight = getCurrentPlayerHeight();
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
    const { pathfinder } = this.scene.systems.nav;
    if (!(NAV_ZONE in pathfinder.zones)) return;
    if (this.navGroup === null) {
      this.navGroup = pathfinder.getGroup(NAV_ZONE, end, true, true);
    }
    this._setNavNode(end);
    this.navNode = pathfinder.clampStep(start, end, this.navNode, NAV_ZONE, this.navGroup, outPos);
    return outPos;
  }
}
