import queryString from "query-string";
const qs = queryString.parse(location.search);
const CLAMP_VELOCITY = 0.01;
const MAX_DELTA = 0.2;

// Does not have any type of collisions yet.
AFRAME.registerComponent("character-controller", {
  schema: {
    groundAcc: { default: 7 },
    easing: { default: 10 },
    pivot: { type: "selector" },
    snapRotationDegrees: { default: THREE.Math.DEG2RAD * 45 },
    rotationSpeed: { default: -3 },
    arScale: { type: 'number' }
  },

  init: function() {
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.accelerationInput = new THREE.Vector3(0, 0, 0);
    this.pendingSnapRotationMatrix = new THREE.Matrix4();
    this.angularVelocity = 0; // Scalar value because we only allow rotation around Y
    this.setAccelerationInput = this.setAccelerationInput.bind(this);
    this.snapRotateLeft = this.snapRotateLeft.bind(this);
    this.snapRotateRight = this.snapRotateRight.bind(this);
    this.setAngularVelocity = this.setAngularVelocity.bind(this);
  },

  update: function() {
    const qsArScale = parseInt(qs.arScale, 10);
    this.arScale = {x: qsArScale || this.data.arScale, y: qsArScale || this.data.arScale, z: qsArScale || this.data.arScale};
    this.leftRotationMatrix = new THREE.Matrix4().makeRotationY(
      this.data.snapRotationDegrees
    );
    this.rightRotationMatrix = new THREE.Matrix4().makeRotationY(
      -this.data.snapRotationDegrees
    );
  },

  play: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.addEventListener("move", this.setAccelerationInput);
    eventSrc.addEventListener("rotateY", this.setAngularVelocity);
    eventSrc.addEventListener("snap_rotate_left", this.snapRotateLeft);
    eventSrc.addEventListener("snap_rotate_right", this.snapRotateRight);
  },

  pause: function() {
    const eventSrc = this.el.sceneEl;
    eventSrc.removeEventListener("move", this.setAccelerationInput);
    eventSrc.removeEventListener("rotateY", this.setAngularVelocity);
    eventSrc.removeEventListener("snap_rotate_left", this.snapRotateLeft);
    eventSrc.removeEventListener("snap_rotate_right", this.snapRotateRight);
  },

  setAccelerationInput: function(event) {
    const axes = event.detail.axis;
    this.accelerationInput.set(axes[0], 0, axes[1]);
  },

  setAngularVelocity: function(event) {
    this.angularVelocity = event.detail.value;
  },

  snapRotateLeft: function(event) {
    this.pendingSnapRotationMatrix.copy(this.leftRotationMatrix);
  },

  snapRotateRight: function(event) {
    this.pendingSnapRotationMatrix.copy(this.rightRotationMatrix);
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

      // Apply AR scale
      if (this.data.arScale && qs.arScale) {
          this.el.setAttribute('scale', this.arScale);
      }

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

    const dvx = data.groundAcc * dt * this.accelerationInput.x;
    const dvz = data.groundAcc * dt * -this.accelerationInput.z;
    velocity.x += dvx;
    velocity.z += dvz;

    const decay = 0.7;
    this.accelerationInput.x = this.accelerationInput.x * decay;
    this.accelerationInput.z = this.accelerationInput.z * decay;
  }
});
