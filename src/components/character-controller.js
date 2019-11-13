import { paths } from "../systems/userinput/paths";
import { SOUND_SNAP_ROTATE, SOUND_TELEPORT_START, SOUND_TELEPORT_END } from "../systems/sound-effects-system";
import { easeOutQuadratic } from "../utils/easing";
import { getPooledMatrix4, freePooledMatrix4 } from "../utils/mat4-pool";
import qsTruthy from "../utils/qs_truthy";
import {
  childMatch,
  rotateInPlaceAroundWorldUp,
  calculateCameraTransformForWaypoint,
  interpolateAffine,
  affixToWorldUp,
  squareDistanceBetween
} from "../utils/three-utils";

import { getCurrentPlayerHeight } from "../utils/get-current-player-height";
import { m4String } from "../utils/pretty-print";
const enableWheelSpeed = qsTruthy("wheelSpeed") || qsTruthy("wheelspeed") || qsTruthy("ws");
const MAX_DELTA = 0.2;
const EPS = 10e-6;
const MAX_WARNINGS = 10;
const NAV_ZONE = "character";
const DEFAULT_WAYPOINT_TRAVEL_TIME = 0;
let WAYPOINT_TRAVEL_TIME = 0; //TODO:variable name and location
const WAYPOINT_DOWN_TIME = 0;

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
 * Avatar movement controller that listens to move, rotate and teleportation events and moves the avatar accordingly.
 * The controller accounts for playspace offset and orientation and depends on the nav mesh system for translation.
 * @namespace avatar
 * @component character-controller
 */
AFRAME.registerComponent("character-controller", {
  schema: {
    groundAcc: { default: 2.9 },
    easing: { default: 10 },
    pivot: { type: "selector" },
    snapRotationRadian: { default: THREE.Math.DEG2RAD * 45 },
    fly: { default: false }
  },

  init: function() {
    this.findPOVPositionAboveNavMesh = this.findPOVPositionAboveNavMesh.bind(this);
    this.tick = this.tick.bind(this);
    this.activeWaypointOptions = {};
    this.charSpeed = 1;
    this.navGroup = null;
    this.navNode = null;
    this.relativeMotion = new THREE.Vector3(0, 0, 0);
    this.dXZ = 0;
    this._withinWarningLimit = true;
    this._warningCount = 0;
    this.enqueueRelativeMotion = this.enqueueRelativeMotion.bind(this);
    this.enqueueInPlaceRotationAroundWorldUp = this.enqueueInPlaceRotationAroundWorldUp.bind(this);
    this.el.sceneEl.addEventListener("nav-mesh-loaded", () => {
      this.navGroup = null;
      this.navNode = null;
    });
    this.waypoints = [];
    this.prevWaypointTravelTime = 0;
  },

  enqueueRelativeMotion: function(motion) {
    this.relativeMotion.add(motion);
  },

  enqueueInPlaceRotationAroundWorldUp: function(dXZ) {
    this.dXZ += dXZ;
  },

  // We assume the rig is at the root, and its local position === its world position.
  teleportTo: (function() {
    const rig = new THREE.Vector3();
    const head = new THREE.Vector3();
    const deltaFromHeadToTargetForHead = new THREE.Vector3();
    const targetForHead = new THREE.Vector3();
    const targetForRig = new THREE.Vector3();
    return function teleportTo(targetWorldPosition) {
      this.isMovementDisabled = false;
      const o = this.el.object3D;
      o.getWorldPosition(rig);
      this.data.pivot.object3D.getWorldPosition(head);
      targetForHead.copy(targetWorldPosition);
      targetForHead.y += this.data.pivot.object3D.position.y;
      deltaFromHeadToTargetForHead.copy(targetForHead).sub(head);
      targetForRig.copy(rig).add(deltaFromHeadToTargetForHead);

      const pathfinder = this.el.sceneEl.systems.nav.pathfinder;
      this.navGroup = pathfinder.getGroup(NAV_ZONE, targetForRig, true, true);
      this.navNode = null;
      this._setNavNode(targetForRig);
      pathfinder.clampStep(rig, targetForRig, this.navNode, NAV_ZONE, this.navGroup, o.position);
      o.matrixNeedsUpdate = true;
    };
  })(),

  // Use this API for waypoint travel so that your matrix doesn't end up in the pool
  // If you have a throw-away matrix, you can push it onto `this.waypoints` and it'll end up in the pool
  enqueueWaypointTravelTo(inMat4, options = {}, travelTime, allowQuickTakeover) {
    const pooledMatrix = getPooledMatrix4();
    const tt = travelTime || DEFAULT_WAYPOINT_TRAVEL_TIME;
    //    options.allowQuickTakeover = allowQuickTakeover;
    this.waypoints.push({ waypoint: pooledMatrix.copy(inMat4), options, travelTime: tt });
  },

  travelByWaypoint: (function() {
    const final = new THREE.Matrix4();
    const translatedUp = new THREE.Matrix4();
    return function travelByWaypoint(inMat4) {
      if (!this.data.fly) {
        this.el.messageDispatch.dispatch("/fly");
        this.shouldLandWhenPossible = true;
        this.shouldUnoccupyWaypointsOnceMoving = true;
      }
      translatedUp.copy(inMat4);
      // TODO: Have to move forward a little too for center-object to center-eye difference
      translatedUp.elements[13] += getCurrentPlayerHeight(); // Waypoints are placed at your feet
      rotateInPlaceAroundWorldUp(translatedUp, Math.PI, translatedUp); // Waypoints are backwards
      translatedUp.multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.25)); // head-to-eye
      this.data.pivot.object3D.updateMatrices();
      calculateCameraTransformForWaypoint(this.data.pivot.object3D.matrixWorld, translatedUp, final);
      childMatch(this.el.object3D, this.data.pivot.object3D, final);
    };
  })(),

  tick: (function() {
    const snapRotatedPOV = new THREE.Matrix4();
    const newPOV = new THREE.Matrix4();
    const displacementToDesiredPOV = new THREE.Vector3();

    const startPOVPosition = new THREE.Vector3();
    const desiredPOVPosition = new THREE.Vector3();
    const navMeshSnappedPOVPosition = new THREE.Vector3();
    const initialScale = new THREE.Vector3();

    return function tick(t, dt) {
      if (!this.el.sceneEl.is("entered")) return;
      const vrMode = this.el.sceneEl.is("vr-mode");
      this.sfx = this.sfx || this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;
      this.waypointSystem = this.waypointSystem || this.el.sceneEl.systems["hubs-systems"].waypointSystem;

      initialScale.copy(this.el.object3D.scale);

      if (
        this.waypoints.length &&
        (this.activeWaypointOptions.allowQuickTakeover ||
          (!this.activeWaypoint && t > this.prevWaypointTravelTime + (WAYPOINT_TRAVEL_TIME + WAYPOINT_DOWN_TIME)))
      ) {
        if (
          this.activeWaypointOptions.allowQuickTakeover &&
          t <= this.prevWaypointTravelTime + (WAYPOINT_TRAVEL_TIME + WAYPOINT_DOWN_TIME)
        ) {
          //freePooledMatrix4(this.activeWaypoint);
          if (this.teleportSound) {
            this.sfx.stopSoundNode(this.teleportSound);
          }
        }
        const { waypoint, options = {}, travelTime } = this.waypoints.splice(0, 1)[0];
        this.activeWaypoint = waypoint;
        this.activeWaypointOptions = options;
        this.isMovementDisabled = options.disableMovement;
        WAYPOINT_TRAVEL_TIME = travelTime || DEFAULT_WAYPOINT_TRAVEL_TIME;
        this.data.pivot.object3D.updateMatrices();
        this.startPoint = new THREE.Matrix4().copy(this.data.pivot.object3D.matrixWorld);
        this.startPoint.elements[13] -= getCurrentPlayerHeight();
        this.prevWaypointTravelTime = t;
        //        this.teleportSound = this.sfx.playSoundLooped(SOUND_TELEPORT_START);
      } else if (this.activeWaypoint && !vrMode && t - this.prevWaypointTravelTime <= WAYPOINT_TRAVEL_TIME) {
        const progress = THREE.Math.clamp((t - this.prevWaypointTravelTime) / WAYPOINT_TRAVEL_TIME, 0, 1);
        const interpolatedWaypoint = interpolateAffine(
          this.startPoint,
          this.activeWaypoint,
          easeOutQuadratic(progress),
          new THREE.Matrix4()
        );
        this.travelByWaypoint(interpolatedWaypoint);
      }
      if (
        this.activeWaypoint &&
        (vrMode ||
          t >= this.prevWaypointTravelTime + WAYPOINT_TRAVEL_TIME ||
          (this.waypoints.length && this.activeWaypointOptions.allowQuickTakeover))
      ) {
        this.travelByWaypoint(this.activeWaypoint);
        freePooledMatrix4(this.activeWaypoint);
        this.activeWaypoint = null;
        if (this.teleportSound) {
          this.sfx.stopSoundNode(this.teleportSound);
        }
        if (!this.activeWaypointOptions.allowQuickTakeover) {
          this.sfx.playSoundOneShot(SOUND_TELEPORT_END);
        }
      }

      const userinput = AFRAME.scenes[0].systems.userinput;
      const snapRotateLeft = userinput.get(paths.actions.snapRotateLeft);
      const snapRotateRight = userinput.get(paths.actions.snapRotateRight);
      if (snapRotateLeft || snapRotateRight) {
        this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SNAP_ROTATE);
      }
      this.data.pivot.object3D.updateMatrices();
      rotateInPlaceAroundWorldUp(
        this.data.pivot.object3D.matrixWorld,
        this.dXZ +
          (snapRotateLeft ? this.data.snapRotationRadian : 0) +
          (snapRotateRight ? -1 * this.data.snapRotationRadian : 0),
        snapRotatedPOV
      );
      const characterAcceleration = userinput.get(paths.actions.characterAcceleration);
      if (characterAcceleration) {
        this.relativeMotion.set(
          this.relativeMotion.x + characterAcceleration[0],
          this.relativeMotion.y,
          -1 * (this.relativeMotion.z + characterAcceleration[1])
        );
      }
      if (userinput.get(paths.actions.toggleFly)) {
        this.shouldLandWhenPossible = false;
        this.el.messageDispatch.dispatch("/fly");
      }
      if (!this.data.fly && this.shouldLandWhenPossible) {
        this.shouldLandWhenPossible = false;
      }
      calculateDisplacementToDesiredPOV(
        snapRotatedPOV,
        this.data.fly,
        this.relativeMotion.multiplyScalar(
          ((userinput.get(paths.actions.boost) ? 2 : 1) * this.data.groundAcc * dt) / 1000
        ),
        displacementToDesiredPOV
      );
      newPOV
        .makeTranslation(displacementToDesiredPOV.x, displacementToDesiredPOV.y, displacementToDesiredPOV.z)
        .multiply(snapRotatedPOV);
      const triedToMove = displacementToDesiredPOV.lengthSq() > 0.001;
      this.findPOVPositionAboveNavMesh(
        startPOVPosition.setFromMatrixPosition(this.data.pivot.object3D.matrixWorld),
        desiredPOVPosition.setFromMatrixPosition(newPOV),
        navMeshSnappedPOVPosition
      );
      const squareDistanceToNavSnappedPOVPosition = desiredPOVPosition.distanceToSquared(navMeshSnappedPOVPosition);
      if (this.data.fly && this.shouldLandWhenPossible && triedToMove && squareDistanceToNavSnappedPOVPosition < 0.5) {
        this.shouldLandWhenPossible = false;
        this.el.messageDispatch.dispatch("/fly");
        newPOV.setPosition(navMeshSnappedPOVPosition);
      } else if (!this.data.fly) {
        newPOV.setPosition(navMeshSnappedPOVPosition);
      }
      if (this.shouldUnoccupyWaypointsOnceMoving && triedToMove) {
        this.shouldUnoccupyWaypointsOnceMoving = false;
        this.waypointSystem.releaseAnyOccupiedWaypoints();
        if (this.data.fly && this.shouldLandWhenPossible && squareDistanceToNavSnappedPOVPosition < 2) {
          newPOV.setPosition(navMeshSnappedPOVPosition);
          this.shouldLandWhenPossible = false;
          this.el.messageDispatch.dispatch("/fly");
        }
      }
      childMatch(this.el.object3D, this.data.pivot.object3D, newPOV);
      this.el.object3D.scale.copy(initialScale);
      this.relativeMotion.set(0, 0, 0);
      this.dXZ = 0;
    };
  })(),

  _warnWithWarningLimit: function(msg) {
    if (!this._withinWarningLimit) return;
    this._warningCount++;
    if (this._warningCount > MAX_WARNINGS) {
      this._withinWarningLimit = false;
      msg = "Warning count exceeded. Will not log further warnings";
    }
    console.warn("character-controller", msg);
  },

  _setNavNode: function(pos) {
    if (this.navNode !== null) return;
    const { pathfinder } = this.el.sceneEl.systems.nav;
    this.navNode =
      pathfinder.getClosestNode(pos, NAV_ZONE, this.navGroup, true) ||
      pathfinder.getClosestNode(pos, NAV_ZONE, this.navGroup);
  },

  findPOVPositionAboveNavMesh: (function() {
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
  })(),

  findPositionOnNavMesh: function(start, end, outPos) {
    const { pathfinder } = this.el.sceneEl.systems.nav;
    if (!(NAV_ZONE in pathfinder.zones)) return;
    if (this.navGroup === null) {
      this.navGroup = pathfinder.getGroup(NAV_ZONE, end, true, true);
    }
    this._setNavNode(end);
    this.navNode = pathfinder.clampStep(start, end, this.navNode, NAV_ZONE, this.navGroup, outPos);
    return outPos;
  }
});
