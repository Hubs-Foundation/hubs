const CLAMP_VELOCITY = 0.01;
const MAX_DELTA = 0.2;
const EPS = 10e-6;

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
    rotationSpeed: { default: -3 }
  },

  init: function() {
    this.navGroup = null;
    this.navNode = null;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.accelerationInput = new THREE.Vector3(0, 0, 0);
    this.pendingSnapRotationMatrix = new THREE.Matrix4();
    this.angularVelocity = 0; // Scalar value because we only allow rotation around Y
    this.setAccelerationInput = this.setAccelerationInput.bind(this);
    this.snapRotateLeft = this.snapRotateLeft.bind(this);
    this.snapRotateRight = this.snapRotateRight.bind(this);
    this.setAngularVelocity = this.setAngularVelocity.bind(this);
    this.handleTeleport = this.handleTeleport.bind(this);
  },

  update: function() {
    this.leftRotationMatrix = new THREE.Matrix4().makeRotationY(this.data.snapRotationDegrees);
    this.rightRotationMatrix = new THREE.Matrix4().makeRotationY(-this.data.snapRotationDegrees);
  },

  play: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.addEventListener("move", this.setAccelerationInput);
    eventSrc.addEventListener("rotateY", this.setAngularVelocity);
    eventSrc.addEventListener("snap_rotate_left", this.snapRotateLeft);
    eventSrc.addEventListener("snap_rotate_right", this.snapRotateRight);
    eventSrc.addEventListener("teleported", this.handleTeleport);
  },

  pause: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.removeEventListener("move", this.setAccelerationInput);
    eventSrc.removeEventListener("rotateY", this.setAngularVelocity);
    eventSrc.removeEventListener("snap_rotate_left", this.snapRotateLeft);
    eventSrc.removeEventListener("snap_rotate_right", this.snapRotateRight);
    eventSrc.removeEventListener("teleported", this.handleTeleport);
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
  },

  snapRotateRight: function() {
    this.pendingSnapRotationMatrix.copy(this.rightRotationMatrix);
  },

  handleTeleport: function(event) {
    const position = event.detail.newPosition;
    const navPosition = event.detail.hitPoint;
    this.resetPositionOnNavMesh(position, navPosition, this.el.object3D);
  },

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
      const deltaSeconds = dt / 1000;
      const root = this.el.object3D;
      const pivot = this.data.pivot.object3D;
      const distance = this.data.groundAcc * deltaSeconds;
      const rotationDelta = this.data.rotationSpeed * this.angularVelocity * deltaSeconds;

      startScale.copy(root.scale);
      startPos.copy(root.position);

      // Other aframe components like teleport-controls set position/rotation/scale, not the matrix, so we need to make sure to compose them back into the matrix
      root.updateMatrix();

      pivotPos.copy(pivot.position);
      pivotPos.applyMatrix4(root.matrix);
      trans.setPosition(pivotPos);
      transInv.makeTranslation(-pivotPos.x, -pivotPos.y, -pivotPos.z);
      rotationMatrix.makeRotationAxis(rotationAxis, root.rotation.y);
      rotationInvMatrix.makeRotationAxis(rotationAxis, -root.rotation.y);
      pivotRotationMatrix.makeRotationAxis(rotationAxis, pivot.rotation.y);
      pivotRotationInvMatrix.makeRotationAxis(rotationAxis, -pivot.rotation.y);
      this.updateVelocity(deltaSeconds);
      move.makeTranslation(this.velocity.x * distance, this.velocity.y * distance, this.velocity.z * distance);
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

      if (this.velocity.lengthSq() > EPS) {
        this.setPositionOnNavMesh(startPos, root.position, root);
      }
    };
  })(),

  setPositionOnNavMesh: function(startPosition, endPosition, object3D) {
    const nav = this.el.sceneEl.systems.nav;
    if (nav.navMesh) {
      if (this.navGroup == null) {
        this.navGroup = nav.getGroup(endPosition);
      }
      this.navNode = this.navNode || nav.getNode(endPosition, this.navGroup);
      this.navNode = nav.clampStep(startPosition, endPosition, this.navGroup, this.navNode, object3D.position);
    }
  },

  resetPositionOnNavMesh: function(position, navPosition, object3D) {
    const nav = this.el.sceneEl.systems.nav;
    if (nav.navMesh) {
      this.navGroup = nav.getGroup(position);
      this.navNode = nav.getNode(navPosition, this.navGroup) || this.navNode;
      this.navNode = nav.clampStep(position, position, this.navGroup, this.navNode, object3D.position);
    }
  },

  updateVelocity: function(dt) {
    const data = this.data;
    const velocity = this.velocity;

    // If FPS too low, reset velocity.
    if (dt > MAX_DELTA) {
      velocity.x = 0;
      velocity.z = 0;
      return;
    }

    // Decay velocity.
    if (velocity.x !== 0) {
      velocity.x -= velocity.x * data.easing * dt;
    }
    if (velocity.z !== 0) {
      velocity.z -= velocity.z * data.easing * dt;
    }
    if (velocity.y !== 0) {
      velocity.y -= velocity.y * data.easing * dt;
    }

    const dvx = data.groundAcc * dt * this.accelerationInput.x;
    const dvz = data.groundAcc * dt * -this.accelerationInput.z;
    velocity.x += dvx;
    velocity.z += dvz;

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
