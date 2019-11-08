import { paths } from "../systems/userinput/paths";
import { SOUND_SNAP_ROTATE, SOUND_TELEPORT_START, SOUND_TELEPORT_END } from "../systems/sound-effects-system";
import { easeOutQuadratic } from "../utils/easing";
import { getPooledMatrix4, freePooledMatrix4 } from "../utils/mat4-pool";
import qsTruthy from "../utils/qs_truthy";
import { childMatch3 } from "../systems/camera-system";
import { calculateCameraTransformForWaypoint, interpolateAffine, affixToWorldUp } from "../utils/three-utils";
import { getCurrentPlayerHeight } from "../utils/get-current-player-height";
const enableWheelSpeed = qsTruthy("wheelSpeed") || qsTruthy("wheelspeed") || qsTruthy("ws");
const CLAMP_VELOCITY = 0.01;
const MAX_DELTA = 0.2;
const EPS = 10e-6;
const MAX_WARNINGS = 10;
const NAV_ZONE = "character";
const DEFAULT_WAYPOINT_TRAVEL_TIME = 0;
let WAYPOINT_TRAVEL_TIME = 0; //TODO:variable name and location
const WAYPOINT_DOWN_TIME = 0;

/**
 * Avatar movement controller that listens to move, rotate and teleportation events and moves the avatar accordingly.
 * The controller accounts for playspace offset and orientation and depends on the nav mesh system for translation.
 * @namespace avatar
 * @component character-controller
 */
AFRAME.registerComponent("character-controller", {
  schema: {
    groundAcc: { default: 5.5 },
    easing: { default: 10 },
    pivot: { type: "selector" },
    snapRotationDegrees: { default: THREE.Math.DEG2RAD * 45 },
    rotationSpeed: { default: -3 },
    fly: { default: false }
  },

  init: function() {
    this.tick = this.tick.bind(this);
    this.activeWaypointOptions = {};
    this.charSpeed = 1;
    this.navGroup = null;
    this.navNode = null;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.accelerationInput = new THREE.Vector3(0, 0, 0);
    this.pendingSnapRotationMatrix = new THREE.Matrix4();
    this.angularVelocity = 0; // Scalar value because we only allow rotation around Y
    this._withinWarningLimit = true;
    this._warningCount = 0;
    this.setAccelerationInput = this.setAccelerationInput.bind(this);
    this.snapRotateLeft = this.snapRotateLeft.bind(this);
    this.snapRotateRight = this.snapRotateRight.bind(this);
    this.setAngularVelocity = this.setAngularVelocity.bind(this);
    this.el.sceneEl.addEventListener("nav-mesh-loaded", () => {
      this.navGroup = null;
      this.navNode = null;
    });
    this.waypoints = [];
    this.prevWaypointTravelTime = 0;
  },

  update: function() {
    this.leftRotationMatrix = new THREE.Matrix4().makeRotationY(this.data.snapRotationDegrees);
    this.rightRotationMatrix = new THREE.Matrix4().makeRotationY(-this.data.snapRotationDegrees);
  },

  play: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.addEventListener("move", this.setAccelerationInput);
    eventSrc.addEventListener("rotateY", this.setAngularVelocity);
  },

  pause: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.removeEventListener("move", this.setAccelerationInput);
    eventSrc.removeEventListener("rotateY", this.setAngularVelocity);
    this.reset();
  },

  reset() {
    this.accelerationInput.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.angularVelocity = 0;
    this.pendingSnapRotationMatrix.identity();
  },

  setAccelerationInput: function(event) {
    const axes = event.detail.axis;
    this.accelerationInput.set(axes[0], 0, axes[1]);
  },

  setAngularVelocity: function(event) {
    this.angularVelocity = event.detail.value;
  },

  snapRotateLeft: function() {
    this.pendingSnapRotationMatrix.copy(this.leftRotationMatrix);
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SNAP_ROTATE);
  },

  snapRotateRight: function() {
    this.pendingSnapRotationMatrix.copy(this.rightRotationMatrix);
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SNAP_ROTATE);
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
      translatedUp.copy(inMat4);
      translatedUp.elements[13] += getCurrentPlayerHeight();
      this.data.pivot.object3D.updateMatrices();
      calculateCameraTransformForWaypoint(this.data.pivot.object3D.matrixWorld, translatedUp, final);
      childMatch3(this.el.object3D, this.data.pivot.object3D, final);
    };
  })(),

  tick: (function() {
    return function(t, dt) {
      if (!this.el.sceneEl.is("entered")) return;
      const vrMode = this.el.sceneEl.is("vr-mode");
      this.sfx = this.sfx || this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem;

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
      if (userinput.get(paths.actions.snapRotateLeft)) {
        this.snapRotateLeft();
      }
      if (userinput.get(paths.actions.snapRotateRight)) {
        this.snapRotateRight();
      }
      if (userinput.get(paths.actions.toggleFly)) {
        this.el.messageDispatch.dispatch("/fly");
      }
      const characterAcceleration = userinput.get(paths.actions.characterAcceleration);
      if (characterAcceleration) {
        this.accelerationInput.set(
          this.accelerationInput.x + characterAcceleration[0],
          this.accelerationInput.y,
          this.accelerationInput.z + characterAcceleration[1]
        );
      }

      this.el.object3D.updateMatrices();
      this.data.pivot.object3D.updateMatrices();

      const m1 = new THREE.Matrix4().extractRotation(this.data.pivot.object3D.matrixWorld);
      const m2 = new THREE.Matrix4()
        .identity()
        .copy(this.pendingSnapRotationMatrix)
        .multiply(m1);
      const scale = new THREE.Vector3().setFromMatrixScale(this.data.pivot.object3D.matrixWorld);
      const position = new THREE.Vector3().setFromMatrixPosition(this.data.pivot.object3D.matrixWorld);
      const snappedPOV = new THREE.Matrix4()
        .copy(m2)
        .scale(scale)
        .setPosition(position.x, position.y, position.z);
      const upAffixedPOVTransform = new THREE.Matrix4().extractRotation(snappedPOV);
      if (!this.data.fly) {
        affixToWorldUp(upAffixedPOVTransform, upAffixedPOVTransform);
      }
      const translationMat = new THREE.Matrix4()
        .identity()
        .copy(upAffixedPOVTransform)
        .multiply(
          new THREE.Matrix4()
            .makeTranslation(this.accelerationInput.x, this.accelerationInput.y, -this.accelerationInput.z)
            .multiplyScalar((this.data.groundAcc * dt) / 1000)
        );
      const translationMat2 = new THREE.Matrix4().makeTranslation(
        translationMat.elements[12],
        translationMat.elements[13],
        translationMat.elements[14]
      );
      const newPOV = new THREE.Matrix4().copy(translationMat2).multiply(snappedPOV);
      if (!this.data.fly) {
        const footPosition = new THREE.Vector3().setFromMatrixPosition(newPOV);
        const newFootPosition = new THREE.Vector3();
        const playerHeight = getCurrentPlayerHeight();
        footPosition.y -= playerHeight;
        this.findPositionOnNavMesh(
          new THREE.Vector3().setFromMatrixPosition(this.el.object3D.matrixWorld),
          footPosition,
          newFootPosition
        );
        newFootPosition.y += playerHeight;
        newPOV.setPosition(newFootPosition);
      }

      childMatch3(this.el.object3D, this.data.pivot.object3D, newPOV);

      this.pendingSnapRotationMatrix.identity(); // Revert to identity
      this.accelerationInput.set(0, 0, 0);
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

  findPositionOnNavMesh: function(start, end, outPos) {
    const { pathfinder } = this.el.sceneEl.systems.nav;
    if (!(NAV_ZONE in pathfinder.zones)) return;
    if (this.navGroup === null) {
      this.navGroup = pathfinder.getGroup(NAV_ZONE, end, true, true);
    }
    this._setNavNode(end);
    this.navNode = pathfinder.clampStep(start, end, this.navNode, NAV_ZONE, this.navGroup, outPos);
    return outPos;
  },

  setPositionOnNavMesh: function(start, end, object3D) {
    const { pathfinder } = this.el.sceneEl.systems.nav;
    if (!(NAV_ZONE in pathfinder.zones)) return;
    if (this.navGroup === null) {
      this.navGroup = pathfinder.getGroup(NAV_ZONE, end, true, true);
    }
    this._setNavNode(end);
    this.navNode = pathfinder.clampStep(start, end, this.navNode, NAV_ZONE, this.navGroup, object3D.position);
    object3D.matrixNeedsUpdate = true;
  },

  updateVelocity: function(dt, pivot) {
    const data = this.data;
    const velocity = this.velocity;

    // If FPS too low, reset velocity.
    if (dt > MAX_DELTA) {
      velocity.x = 0;
      velocity.y = 0;
      velocity.z = 0;
      return;
    }

    // Decay velocity.
    if (velocity.x !== 0) {
      velocity.x -= velocity.x * data.easing * dt;
    }
    if (velocity.y !== 0) {
      velocity.y -= velocity.y * data.easing * dt;
    }
    if (velocity.z !== 0) {
      velocity.z -= velocity.z * data.easing * dt;
    }

    const dvx = data.groundAcc * dt * this.accelerationInput.x;
    const dvz = data.groundAcc * dt * -this.accelerationInput.z;
    velocity.x += dvx;

    if (this.data.fly) {
      velocity.y += dvz * -Math.sin(pivot.rotation.x);
      velocity.z += dvz * Math.cos(pivot.rotation.x);
    } else {
      velocity.z += dvz;
    }

    const decay = 0.7;
    this.accelerationInput.x = this.accelerationInput.x * decay;
    this.accelerationInput.z = this.accelerationInput.z * decay;

    if (Math.abs(velocity.x) < CLAMP_VELOCITY) {
      velocity.x = 0;
    }
    if (Math.abs(velocity.y) < CLAMP_VELOCITY) {
      velocity.y = 0;
    }
    if (Math.abs(velocity.z) < CLAMP_VELOCITY) {
      velocity.z = 0;
    }
  }
});
