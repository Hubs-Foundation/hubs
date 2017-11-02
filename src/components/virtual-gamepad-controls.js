import nipplejs from "nipplejs";

var THREE = AFRAME.THREE;
var DEGREES = Math.PI / 180;
var HALF_PI = Math.PI / 2;

AFRAME.registerComponent("virtual-gamepad-controls", {
  schema: {
    // Constants
    movementSpeed: { default: 2 },
    lookSpeed: { default: 60 }
  },

  init() {
    // Remove any look-controls components.
    // var lookControls = document.querySelectorAll("[look-controls]");
    // for (var el of lookControls) {
    //   el.removeAttribute("look-controls");
    // }

    // Define touch zones
    var leftTouchZone = document.createElement("div");
    leftTouchZone.style.position = "absolute";
    leftTouchZone.style.left = 0;
    leftTouchZone.style.top = 0;
    leftTouchZone.style.bottom = 0;
    leftTouchZone.style.right = "50%";

    var rightTouchZone = document.createElement("div");
    rightTouchZone.style.position = "absolute";
    rightTouchZone.style.left = "50%";
    rightTouchZone.style.top = 0;
    rightTouchZone.style.bottom = 0;
    rightTouchZone.style.right = 0;

    document.body.appendChild(leftTouchZone);
    document.body.appendChild(rightTouchZone);

    var leftStick = nipplejs.create({
      zone: leftTouchZone,
      mode: "static",
      position: { left: "100px", bottom: "100px" },
      color: "white"
    });

    var rightStick = nipplejs.create({
      zone: rightTouchZone,
      mode: "static",
      position: { right: "100px", bottom: "100px" },
      color: "white"
    });

    this.onJoystickChanged = this.onJoystickChanged.bind(this);

    rightStick.on("move end", this.onJoystickChanged);
    leftStick.on("move end", this.onJoystickChanged);

    this.leftStick = leftStick;
    this.rightStick = rightStick;

    this.cameraEl = document.querySelector("[camera]");
    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;

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
  },

  onJoystickChanged(event, data) {
    if (event.target.id === this.leftStick.id) {
      if (event.type === "move") {
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
        var angle = data.angle.radian;
        var force = data.force < 1 ? data.force : 1;
        this.yaw = Math.cos(angle) * -force;
        this.pitch = Math.sin(angle) * force;
      } else {
        this.yaw = 0;
        this.pitch = 0;
      }
    }
  },

  tick(t, dt) {
    var lookSpeed = THREE.Math.DEG2RAD * this.data.lookSpeed * (dt / 1000);

    const obj = this.el.object3D;
    const pivot = this.cameraEl.object3D;
    const distance = this.data.movementSpeed * (dt / 1000);

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

    obj.applyMatrix(this.transInv);
    obj.applyMatrix(this.rotationInvMatrix);
    obj.applyMatrix(this.camRotationInvMatrix);
    obj.applyMatrix(this.move);
    obj.applyMatrix(this.yawMatrix);
    obj.applyMatrix(this.camRotationMatrix);
    obj.applyMatrix(this.rotationMatrix);
    obj.applyMatrix(this.trans);

    // @TODO this is really ugly, can't just set the position/rotation directly or they wont network
    this.el.setAttribute("rotation", {
      x: obj.rotation.x * THREE.Math.RAD2DEG,
      y: obj.rotation.y * THREE.Math.RAD2DEG,
      z: obj.rotation.z * THREE.Math.RAD2DEG
    });
    this.el.setAttribute("position", obj.position);
  }
});
