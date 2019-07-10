import { paths } from "../systems/userinput/paths";
import { SOUND_SNAP_ROTATE } from "../systems/sound-effects-system";
const CLAMP_VELOCITY = 0.01;
const MAX_DELTA = 0.2;
const EPS = 10e-6;
const MAX_WARNINGS = 10;

const NAV_ZONE = "character";

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

  tick: (function() {
    const move = new THREE.Matrix4();
    const trans = new THREE.Matrix4();
    const transInv = new THREE.Matrix4();
    const pivotPos = new THREE.Vector3();
    const rotationAxis = new THREE.Vector3(0, 1, 0);
    const yawMatrix = new THREE.Matrix4();
    const rotationMatrix = new THREE.Matrix4();
    const rotationInvMatrix = new THREE.Matrix4();
    const pivotRotationMatrix = new THREE.Matrix4();
    const pivotRotationInvMatrix = new THREE.Matrix4();
    const startPos = new THREE.Vector3();
    const startScale = new THREE.Vector3();

    return function(t, dt) {
      if (!this.el.sceneEl.is("entered")) return;
      const deltaSeconds = dt / 1000;
      const root = this.el.object3D;
      const pivot = this.data.pivot.object3D;
      const distance = this.data.groundAcc * deltaSeconds;

      const userinput = AFRAME.scenes[0].systems.userinput;
      const userinputAngularVelocity = userinput.get(paths.actions.angularVelocity);
      if (userinputAngularVelocity !== null && userinputAngularVelocity !== undefined) {
        this.angularVelocity = userinputAngularVelocity;
      }
      const rotationDelta = this.data.rotationSpeed * this.angularVelocity * deltaSeconds;

      pivot.updateMatrices();
      root.updateMatrices();

      startScale.copy(root.scale);
      startPos.copy(root.position);

      if (userinput.get(paths.actions.snapRotateLeft)) {
        this.snapRotateLeft();
      }
      if (userinput.get(paths.actions.snapRotateRight)) {
        this.snapRotateRight();
      }
      const acc = userinput.get(paths.actions.characterAcceleration);
      if (acc) {
        this.accelerationInput.set(
          this.accelerationInput.x + acc[0],
          this.accelerationInput.y + 0,
          this.accelerationInput.z + acc[1]
        );
      }

      pivotPos.copy(pivot.position);
      pivotPos.applyMatrix4(root.matrix);
      trans.setPosition(pivotPos);
      transInv.makeTranslation(-pivotPos.x, -pivotPos.y, -pivotPos.z);
      rotationMatrix.makeRotationAxis(rotationAxis, root.rotation.y);
      rotationInvMatrix.makeRotationAxis(rotationAxis, -root.rotation.y);
      pivotRotationMatrix.makeRotationAxis(rotationAxis, pivot.rotation.y);
      pivotRotationInvMatrix.makeRotationAxis(rotationAxis, -pivot.rotation.y);
      this.updateVelocity(deltaSeconds, pivot);
      this.accelerationInput.set(0, 0, 0);

      const boost = userinput.get(paths.actions.boost) ? 2 : 1;
      move.makeTranslation(
        this.velocity.x * distance * boost,
        this.velocity.y * distance * boost,
        this.velocity.z * distance * boost
      );
      yawMatrix.makeRotationAxis(rotationAxis, rotationDelta);

      // Translate to middle of playspace (player rig)
      root.matrix.premultiply(transInv);
      // Zero playspace (player rig) rotation
      root.matrix.premultiply(rotationInvMatrix);
      // Zero pivot (camera/head) rotation
      root.matrix.premultiply(pivotRotationInvMatrix);
      // Apply joystick translation
      root.matrix.premultiply(move);
      // Apply joystick yaw rotation
      root.matrix.premultiply(yawMatrix);
      // Apply snap rotation if necessary
      root.matrix.premultiply(this.pendingSnapRotationMatrix);
      // Reapply pivot (camera/head) rotation
      root.matrix.premultiply(pivotRotationMatrix);
      // Reapply playspace (player rig) rotation
      root.matrix.premultiply(rotationMatrix);
      // Reapply playspace (player rig) translation
      root.matrix.premultiply(trans);
      // update pos/rot/scale
      root.matrix.decompose(root.position, root.quaternion, root.scale);

      // TODO: the above matrix trnsfomraitons introduce some floating point errors in scale, this reverts them to
      // avoid spamming network with fake scale updates
      root.scale.copy(startScale);

      this.pendingSnapRotationMatrix.identity(); // Revert to identity

      if (this.velocity.lengthSq() > EPS && !this.data.fly) {
        this.setPositionOnNavMesh(startPos, root.position, root);
      }

      root.matrixNeedsUpdate = true;
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
