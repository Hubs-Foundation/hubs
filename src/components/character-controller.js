import AFRAME from "aframe";
const CLAMP_VELOCITY = 0.01;
const MAX_DELTA = 0.2;

// Does not have any type of collisions yet.
AFRAME.registerComponent("character-controller", {
  schema: {
    groundAcc: { default: 10 },
    easing: { default: 8 },
    pivot: { type: "selector" },
    snapRotationRadian: { default: THREE.Math.DEG2RAD * 45 },
    wasdSpeed: { default: 0.8 },
    rotationSpeed: { default: -3 }
  },

  init: function() {
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.accelerationInput = new THREE.Vector3(0, 0, 0);
    this.onStopMoving = this.onStopMoving.bind(this);
    this.onTranslateX = this.onTranslateX.bind(this);
    this.onTranslateY = this.onTranslateY.bind(this);
    this.onTranslateZ = this.onTranslateZ.bind(this);
    this.onMoveForward = this.onMoveForward.bind(this);
    this.onDontMoveForward = this.onDontMoveForward.bind(this);
    this.onMoveBackward = this.onMoveBackward.bind(this);
    this.onDontMoveBackward = this.onDontMoveBackward.bind(this);
    this.onMoveLeft = this.onMoveLeft.bind(this);
    this.onDontMoveLeft = this.onDontMoveLeft.bind(this);
    this.onMoveRight = this.onMoveRight.bind(this);
    this.onDontMoveRight = this.onDontMoveRight.bind(this);
    this.boost = 1.0;
    this.onBoost = this.onBoost.bind(this);

    this.pendingSnapRotationMatrix = new THREE.Matrix4();
    this.onSnapRotateLeft = this.onSnapRotateLeft.bind(this);
    this.onSnapRotateRight = this.onSnapRotateRight.bind(this);
    this.angularVelocity = 0; // Scalar value because we only allow rotation around Y
    this.onRotateY = this.onRotateY.bind(this);
  },

  update: function() {
    this.leftRotationMatrix = new THREE.Matrix4().makeRotationY(
      this.data.snapRotationRadian
    );
    this.rightRotationMatrix = new THREE.Matrix4().makeRotationY(
      -this.data.snapRotationRadian
    );
  },

  play: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.addEventListener("stop_moving", this.onStopMoving);
    eventSrc.addEventListener("translateX", this.onTranslateX);
    eventSrc.addEventListener("translateY", this.onTranslateY);
    eventSrc.addEventListener("translateZ", this.onTranslateZ);
    eventSrc.addEventListener("action_move_forward", this.onMoveForward);
    eventSrc.addEventListener(
      "action_dont_move_forward",
      this.onDontMoveForward
    );
    eventSrc.addEventListener("action_move_backward", this.onMoveBackward);
    eventSrc.addEventListener(
      "action_dont_move_backward",
      this.onDontMoveBackward
    );
    eventSrc.addEventListener("action_move_left", this.onMoveLeft);
    eventSrc.addEventListener("action_dont_move_left", this.onDontMoveLeft);
    eventSrc.addEventListener("action_move_right", this.onMoveRight);
    eventSrc.addEventListener("action_dont_move_right", this.onDontMoveRight);

    eventSrc.addEventListener("rotateY", this.onRotateY);
    eventSrc.addEventListener("action_snap_rotate_left", this.onSnapRotateLeft);
    eventSrc.addEventListener(
      "action_snap_rotate_right",
      this.onSnapRotateRight
    );
    eventSrc.addEventListener("boost", this.onBoost);
  },

  pause: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.removeEventListener("stop_moving", this.onStopMoving);
    eventSrc.removeEventListener("translateX", this.onTranslateX);
    eventSrc.removeEventListener("translateY", this.onTranslateY);
    eventSrc.removeEventListener("translateZ", this.onTranslateZ);
    eventSrc.removeEventListener("action_move_forward", this.onMoveForward);
    eventSrc.removeEventListener(
      "action_dont_move_forward",
      this.onDontMoveForward
    );
    eventSrc.removeEventListener("action_move_backward", this.onMoveBackward);
    eventSrc.removeEventListener(
      "action_dont_move_backward",
      this.onDontMoveBackward
    );
    eventSrc.removeEventListener("action_move_left", this.onMoveLeft);
    eventSrc.removeEventListener("action_dont_move_left", this.onDontMoveLeft);
    eventSrc.removeEventListener("action_move_right", this.onMoveRight);
    eventSrc.removeEventListener(
      "action_dont_move_right",
      this.onDontMoveRight
    );
    eventSrc.removeEventListener("rotateY", this.onRotateY);
    eventSrc.removeEventListener(
      "action_snap_rotate_left",
      this.onSnapRotateLeft
    );
    eventSrc.removeEventListener(
      "action_snap_rotate_right",
      this.onSnapRotateRight
    );
  },

  onStopMoving: function(event) {
    this.accelerationInput.set(0, 0, 0);
  },

  onTranslateX: function(event) {
    if (typeof event.detail !== "object") {
      this.accelerationInput.setX(event.detail);
    } else {
      this.accelerationInput.setX(0);
    }
  },

  onTranslateY: function(event) {
    if (typeof event.detail !== "object") {
      this.accelerationInput.setY(event.detail);
    } else {
      this.accelerationInput.setY(0);
    }
  },

  onTranslateZ: function(event) {
    if (typeof event.detail !== "object") {
      this.accelerationInput.setZ(event.detail);
    } else {
      this.accelerationInput.setZ(0);
    }
  },

  onMoveForward: function(event) {
    this.accelerationInput.z = this.data.wasdSpeed;
  },

  onDontMoveForward: function(event) {
    this.accelerationInput.z = 0;
  },

  onMoveBackward: function(event) {
    this.accelerationInput.z = -this.data.wasdSpeed;
  },

  onDontMoveBackward: function(event) {
    this.accelerationInput.z = 0;
  },

  onMoveLeft: function(event) {
    this.accelerationInput.x = -this.data.wasdSpeed;
  },

  onDontMoveLeft: function(event) {
    this.accelerationInput.x = 0;
  },

  onMoveRight: function(event) {
    this.accelerationInput.x = this.data.wasdSpeed;
  },

  onDontMoveRight: function(event) {
    this.accelerationInput.x = 0;
  },

  onRotateY: function(event) {
    if (typeof event.detail !== "object") {
      this.angularVelocity = event.detail;
    } else {
      this.angularVelocity = 0;
    }
  },

  onSnapRotateLeft: function(event) {
    this.pendingSnapRotationMatrix.copy(this.leftRotationMatrix);
  },

  onSnapRotateRight: function(event) {
    this.pendingSnapRotationMatrix.copy(this.rightRotationMatrix);
  },

  onBoost: function(event) {
    this.boost = event.detail;
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
    const position = new THREE.Vector3();
    const currentPosition = new THREE.Vector3();
    const movementVector = new THREE.Vector3();

    return function(t, dt) {
      const deltaSeconds = dt / 1000;
      const root = this.el.object3D;
      const pivot = this.data.pivot.object3D;
      const distance = this.data.groundAcc * deltaSeconds;
      const rotationDelta =
        this.data.rotationSpeed * this.angularVelocity * deltaSeconds;

      pivotPos.copy(pivot.position);
      pivotPos.applyMatrix4(root.matrix);
      trans.setPosition(pivotPos);
      transInv.makeTranslation(-pivotPos.x, -pivotPos.y, -pivotPos.z);
      rotationMatrix.makeRotationAxis(rotationAxis, root.rotation.y);
      rotationInvMatrix.makeRotationAxis(rotationAxis, -root.rotation.y);
      pivotRotationMatrix.makeRotationAxis(rotationAxis, pivot.rotation.y);
      pivotRotationInvMatrix.makeRotationAxis(rotationAxis, -pivot.rotation.y);
      this.updateVelocity(deltaSeconds);
      move.makeTranslation(
        this.velocity.x * distance,
        this.velocity.y * distance,
        this.velocity.z * distance
      );
      yawMatrix.makeRotationAxis(rotationAxis, rotationDelta);

      // Translate to middle of playspace (player rig)
      root.applyMatrix(transInv);
      // Zero playspace (player rig) rotation
      root.applyMatrix(rotationInvMatrix);
      // Zero pivot (camera/head) rotation
      root.applyMatrix(pivotRotationInvMatrix);
      // Apply joystick translation
      root.applyMatrix(move);
      // Apply joystick yaw rotation
      root.applyMatrix(yawMatrix);
      // Apply snap rotation if necessary
      root.applyMatrix(this.pendingSnapRotationMatrix);
      // Reapply pivot (camera/head) rotation
      root.applyMatrix(pivotRotationMatrix);
      // Reapply playspace (player rig) rotation
      root.applyMatrix(rotationMatrix);
      // Reapply playspace (player rig) translation
      root.applyMatrix(trans);

      // @TODO this is really ugly, can't just set the position/rotation directly or they wont network
      this.el.setAttribute("rotation", {
        x: root.rotation.x * THREE.Math.RAD2DEG,
        y: root.rotation.y * THREE.Math.RAD2DEG,
        z: root.rotation.z * THREE.Math.RAD2DEG
      });

      this.el.setAttribute("position", root.position);

      this.pendingSnapRotationMatrix.identity(); // Revert to identity
    };
  })(),

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

    // Clamp velocity easing.
    if (Math.abs(velocity.x) < CLAMP_VELOCITY) {
      velocity.x = 0;
    }
    if (Math.abs(velocity.y) < CLAMP_VELOCITY) {
      velocity.y = 0;
    }
    if (Math.abs(velocity.z) < CLAMP_VELOCITY) {
      velocity.z = 0;
    }

    const dvx = data.groundAcc * dt * this.accelerationInput.x * this.boost;
    const dvz = data.groundAcc * dt * -this.accelerationInput.z * this.boost;
    velocity.x += dvx;
    velocity.z += dvz;
  }
});
