import nipplejs from "nipplejs";
import styles from "./virtual-gamepad-controls.css";

AFRAME.registerComponent("virtual-gamepad-controls", {
  schema: {},

  init() {
    // Setup gamepad elements
    const leftTouchZone = document.createElement("div");
    leftTouchZone.classList.add(styles.touchZone, styles.left);
    document.body.appendChild(leftTouchZone);

    const rightTouchZone = document.createElement("div");
    rightTouchZone.classList.add(styles.touchZone, styles.right);
    document.body.appendChild(rightTouchZone);

    const leftStick = nipplejs.create({
      zone: leftTouchZone,
      color: "white",
      fadeTime: 0
    });

    const rightStick = nipplejs.create({
      zone: rightTouchZone,
      color: "white",
      fadeTime: 0
    });

    this.onMoveJoystickChanged = this.onMoveJoystickChanged.bind(this);
    this.onMoveJoystickEnd = this.onMoveJoystickEnd.bind(this);
    this.onLookJoystickChanged = this.onLookJoystickChanged.bind(this);
    this.onLookJoystickEnd = this.onLookJoystickEnd.bind(this);

    leftStick.on("move", this.onMoveJoystickChanged);
    leftStick.on("end", this.onMoveJoystickEnd);

    rightStick.on("move", this.onLookJoystickChanged);
    rightStick.on("end", this.onLookJoystickEnd);

    this.leftTouchZone = leftTouchZone;
    this.rightTouchZone = rightTouchZone;
    this.leftStick = leftStick;
    this.rightStick = rightStick;

    this.inVr = false;
    this.moving = false;
    this.rotating = false;

    this.moveEvent = {
      axis: [0, 0]
    };
    this.rotateYEvent = {
      value: 0
    };

    this.onEnterVr = this.onEnterVr.bind(this);
    this.onExitVr = this.onExitVr.bind(this);
    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVr);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVr);
  },

  onMoveJoystickChanged(event, joystick) {
    const angle = joystick.angle.radian;
    const force = joystick.force < 1 ? joystick.force : 1;
    const x = Math.cos(angle) * force;
    const z = Math.sin(angle) * force;
    this.moving = true;
    this.moveEvent.axis[0] = x;
    this.moveEvent.axis[1] = z;
  },

  onMoveJoystickEnd() {
    this.moving = false;
    this.moveEvent.axis[0] = 0;
    this.moveEvent.axis[1] = 0;
    this.el.sceneEl.emit("move", this.moveEvent);
  },

  onLookJoystickChanged(event, joystick) {
    // Set pitch and yaw angles on right stick move
    const angle = joystick.angle.radian;
    const force = joystick.force < 1 ? joystick.force : 1;
    this.rotating = true;
    this.rotateYEvent.value = Math.cos(angle) * force;
  },

  onLookJoystickEnd() {
    this.rotating = false;
    this.rotateYEvent.value = 0;
    this.el.sceneEl.emit("rotateY", this.rotateYEvent);
  },

  tick() {
    if (!this.inVr) {
      if (this.moving) {
        this.el.sceneEl.emit("move", this.moveEvent);
      }

      if (this.rotating) {
        this.el.sceneEl.emit("rotateY", this.rotateYEvent);
      }
    }
  },

  onEnterVr() {
    // Hide the joystick controls
    this.inVr = true;
    this.leftTouchZone.style.display = "none";
    this.rightTouchZone.style.display = "none";
  },

  onExitVr() {
    // Show the joystick controls
    this.inVr = false;
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
