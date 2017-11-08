import nipplejs from "nipplejs";
import styles from "./virtual-gamepad-controls.css";

var THREE = AFRAME.THREE;
var DEGREES = Math.PI / 180;
var HALF_PI = Math.PI / 2;

AFRAME.registerComponent("virtual-gamepad-controls", {
  schema: {
    movementSpeed: { default: 2 },
    lookSpeed: { default: 60 }
  },

  init() {
    // Setup gamepad elements
    var leftTouchZone = document.createElement("div");
    leftTouchZone.classList.add(styles.touchZone, styles.left);
    document.body.appendChild(leftTouchZone);

    var rightTouchZone = document.createElement("div");
    rightTouchZone.classList.add(styles.touchZone, styles.right);
    document.body.appendChild(rightTouchZone);

    var leftStick = nipplejs.create({
      zone: leftTouchZone,
      mode: "static",
      color: "white"
    });

    var rightStick = nipplejs.create({
      zone: rightTouchZone,
      mode: "static",
      color: "white"
    });

    this.onJoystickChanged = this.onJoystickChanged.bind(this);

    rightStick.on("move end", this.onJoystickChanged);
    leftStick.on("move end", this.onJoystickChanged);

    this.leftTouchZone = leftTouchZone;
    this.rightTouchZone = rightTouchZone;
    this.leftStick = leftStick;
    this.rightStick = rightStick;

    // Define initial state
    this.velocity = new THREE.Vector3();
    this.yaw = 0;

    // Allocate matrices and vectors
    this.move = new THREE.Matrix4();
    this.trans = new THREE.Matrix4();
    this.transInv = new THREE.Matrix4();
    this.pivotPos = new THREE.Vector3();
    this.rotationAxis = new THREE.Vector3(0, 1, 0);
    this.yawMatrix = new THREE.Matrix4();
    this.rotationMatrix = new THREE.Matrix4();
    this.rotationInvMatrix = new THREE.Matrix4();
    this.camRotationMatrix = new THREE.Matrix4();
    this.camRotationInvMatrix = new THREE.Matrix4();

    this.cameraEl = document.querySelector("[camera]");

    this.onEnterVr = this.onEnterVr.bind(this);
    this.onExitVr = this.onExitVr.bind(this);
    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVr);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVr);
  },

  onJoystickChanged(event, data) {
    if (event.target.id === this.leftStick.id) {
      if (event.type === "move") {
        // Set velocity vector on left stick move
        var angle = data.angle.radian;
        var force = data.force < 1 ? data.force : 1;
        var x = Math.cos(angle) * force;
        var z = Math.sin(angle) * -force;
        this.velocity.set(x, 0, z);
      } else {
        this.velocity.set(0, 0, 0);
      }
    } else {
      if (event.type === "move") {
        // Set yaw angle on right stick move
        var angle = data.angle.radian;
        var force = data.force < 1 ? data.force : 1;
        this.yaw = Math.cos(angle) * -force;
      } else {
        this.yaw = 0;
      }
    }
  },

  tick(t, dt) {
    const deltaSeconds = dt / 1000;
    const lookSpeed = THREE.Math.DEG2RAD * this.data.lookSpeed * deltaSeconds;
    const obj = this.el.object3D;
    const pivot = this.cameraEl.object3D;
    const distance = this.data.movementSpeed * deltaSeconds;

    this.pivotPos.copy(pivot.position);
    this.pivotPos.applyMatrix4(obj.matrix);
    this.trans.setPosition(this.pivotPos);
    this.transInv.makeTranslation(
      -this.pivotPos.x,
      -this.pivotPos.y,
      -this.pivotPos.z
    );
    this.rotationMatrix.makeRotationAxis(this.rotationAxis, obj.rotation.y);
    this.rotationInvMatrix.makeRotationAxis(this.rotationAxis, -obj.rotation.y);
    this.camRotationMatrix.makeRotationAxis(
      this.rotationAxis,
      pivot.rotation.y
    );
    this.camRotationInvMatrix.makeRotationAxis(
      this.rotationAxis,
      -pivot.rotation.y
    );
    this.move.makeTranslation(
      this.velocity.x * distance,
      this.velocity.y * distance,
      this.velocity.z * distance
    );

    this.yawMatrix.makeRotationAxis(this.rotationAxis, lookSpeed * this.yaw);

    // Translate to middle of playspace (player rig)
    obj.applyMatrix(this.transInv);
    // Zero playspace (player rig) rotation
    obj.applyMatrix(this.rotationInvMatrix);
    // Zero camera (head) rotation
    obj.applyMatrix(this.camRotationInvMatrix);
    // Apply joystick translation
    obj.applyMatrix(this.move);
    // Apply joystick yaw rotation
    obj.applyMatrix(this.yawMatrix);
    // Reapply camera (head) rotation
    obj.applyMatrix(this.camRotationMatrix);
    // Reapply playspace (player rig) rotation
    obj.applyMatrix(this.rotationMatrix);
    // Reapply playspace (player rig) translation
    obj.applyMatrix(this.trans);

    this.el.setAttribute("rotation", {
      x: obj.rotation.x * THREE.Math.RAD2DEG,
      y: obj.rotation.y * THREE.Math.RAD2DEG,
      z: obj.rotation.z * THREE.Math.RAD2DEG
    });
    this.el.setAttribute("position", obj.position);
  },

  onEnterVr() {
    // Hide the joystick controls
    this.leftTouchZone.style.display = "none";
    this.rightTouchZone.style.display = "none";
  },

  onExitVr() {
    // Show the joystick controls
    this.leftTouchZone.style.display = "block";
    this.rightTouchZone.style.display = "block";
  },

  remove() {
    this.el.sceneEl.removeEventListener("entervr", this.onEnterVr);
    this.el.sceneEl.removeEventListener("exitvr", this.onExitVr);
    document.body.removeChild(this.leftTouchZone);
    document.body.removeChild(this.rightTouchZone);
  }
});
