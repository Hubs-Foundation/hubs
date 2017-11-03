import AFRAME from "aframe";
var CLAMP_VELOCITY = 0.01;
var MAX_DELTA = 0.2;
var TAU = Math.PI * 2;

// Does not have any type of collisions yet.
AFRAME.registerComponent("character-controller", {
  schema: {
    groundAcc: { default: 10 },
    verticalAcc: { default: 80 },
    easing: { default: 8 },
    pivot: { type: "selector" },
    snapRotationRadian: { default: TAU / 8 }
  },

  init: function() {
    this.startTranslating = this.startTranslating.bind(this);
    this.stopTranslating = this.stopTranslating.bind(this);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.accelerationInput = new THREE.Vector3(0, 0, 0);
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

    this.startRotating = this.startRotating.bind(this);
    this.stopRotating = this.stopRotating.bind(this);
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
    var eventSrc = this.el.sceneEl;
    this.el.sceneEl.addEventListener(
      "start_translating",
      this.startTranslating
    );
    eventSrc.addEventListener("stop_translating", this.stopTranslating);
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
    this.el.removeEventListener("start_translating", this.startTranslating);
    this.el.removeEventListener("stop_translating", this.stopTranslating);
    this.el.removeEventListener("translateX", this.onTranslateX);
    this.el.removeEventListener("translateY", this.onTranslateY);
    this.el.removeEventListener("translateZ", this.onTranslateZ);
    this.el.removeEventListener("action_move_forward", this.onMoveForward);
    this.el.removeEventListener(
      "action_dont_move_forward",
      this.onDontMoveForward
    );
    this.el.removeEventListener("action_move_backward", this.onMoveBackward);
    this.el.removeEventListener(
      "action_dont_move_backward",
      this.onDontMoveBackward
    );
    this.el.removeEventListener("action_move_left", this.onMoveLeft);
    this.el.removeEventListener("action_dont_move_left", this.onDontMoveLeft);
    this.el.removeEventListener("action_move_right", this.onMoveRight);
    this.el.removeEventListener("action_dont_move_right", this.onDontMoveRight);
    this.el.removeEventListener("rotateY", this.onRotateY);
    this.el.removeEventListener(
      "action_snap_rotate_left",
      this.onSnapRotateLeft
    );
    this.el.removeEventListener(
      "action_snap_rotate_right",
      this.onSnapRotateRight
    );
  },

  startTranslating: function() {},

  stopTranslating: function() {
    this.accelerationInput.set(0, 0, 0);
  },

  startRotating: function() {},

  stopRotating: function() {},

  onTranslateX: function(event) {
    // bug : the last trackpadaxismovex event.detail is the html el instead of a number.
    // I don't know why this is...
    // Is touch up considered an axismove to (0,0)?
    if (typeof event.detail === "number") {
      this.accelerationInput.setX(event.detail);
    } else {
      this.accelerationInput.setX(0);
    }
  },
  onTranslateY: function(event) {
    if (typeof event.detail === "number") {
      this.accelerationInput.setY(event.detail);
    } else {
      this.accelerationInput.setY(0);
    }
  },
  onTranslateZ: function(event) {
    if (typeof event.detail === "number") {
      this.accelerationInput.setZ(event.detail);
    } else {
      this.accelerationInput.setZ(0);
    }
  },

  onMoveForward: function(event) {
    this.accelerationInput.z = 0.8;
  },

  onDontMoveForward: function(event) {
    this.accelerationInput.z = 0;
  },

  onMoveBackward: function(event) {
    this.accelerationInput.z = -0.8;
  },

  onDontMoveBackward: function(event) {
    this.accelerationInput.z = 0;
  },

  onMoveLeft: function(event) {
    this.accelerationInput.x = -0.8;
  },

  onDontMoveLeft: function(event) {
    this.accelerationInput.x = 0;
  },

  onMoveRight: function(event) {
    this.accelerationInput.x = 0.8;
  },

  onDontMoveRight: function(event) {
    this.accelerationInput.x = 0;
  },

  onRotateY: function(event) {
    if (typeof event.detail === "number") {
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
    var move = new THREE.Matrix4();
    var trans = new THREE.Matrix4();
    var transInv = new THREE.Matrix4();
    var pivotPos = new THREE.Vector3();
    var rotationAxis = new THREE.Vector3(0, 1, 0);
    var yawMatrix = new THREE.Matrix4();
    var rotationMatrix = new THREE.Matrix4();
    var rotationInvMatrix = new THREE.Matrix4();
    var pivotRotationMatrix = new THREE.Matrix4();
    var pivotRotationInvMatrix = new THREE.Matrix4();
    var position = new THREE.Vector3();
    var currentPosition = new THREE.Vector3();
    var movementVector = new THREE.Vector3();

    return function(t, dt) {
      const deltaSeconds = dt / 1000;
      const rotationSpeed = -3;
      const root = this.el.object3D;
      const pivot = this.data.pivot.object3D;
      const distance = this.data.groundAcc * deltaSeconds;

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

      yawMatrix.makeRotationAxis(
        rotationAxis,
        rotationSpeed * this.angularVelocity * deltaSeconds
      );

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
    var data = this.data;
    var velocity = this.velocity;

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
    var dvx = data.groundAcc * dt * this.accelerationInput.x * this.boost;
    var dvz = data.groundAcc * dt * -this.accelerationInput.z * this.boost;
    velocity.x += dvx;
    velocity.z += dvz;
  }
});
