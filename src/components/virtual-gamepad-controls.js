import nipplejs from "nipplejs";
import styles from "./virtual-gamepad-controls.css";

const THREE = AFRAME.THREE;
const DEGREES = Math.PI / 180;
const HALF_PI = Math.PI / 2;

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
      mode: "static",
      color: "white",
      position: { left: "50px", bottom: "50px" }
    });

    const rightStick = nipplejs.create({
      zone: rightTouchZone,
      mode: "static",
      color: "white",
      position: { right: "50px", bottom: "50px" }
    });

    this.onJoystickChanged = this.onJoystickChanged.bind(this);

    rightStick.on("move end", this.onJoystickChanged);
    leftStick.on("move end", this.onJoystickChanged);

    this.leftTouchZone = leftTouchZone;
    this.rightTouchZone = rightTouchZone;
    this.leftStick = leftStick;
    this.rightStick = rightStick;

    this.yaw = 0;

    this.onEnterVr = this.onEnterVr.bind(this);
    this.onExitVr = this.onExitVr.bind(this);
    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVr);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVr);
  },

  onJoystickChanged(event, joystick) {
    if (event.target.id === this.leftStick.id) {
      if (event.type === "move") {
        var angle = joystick.angle.radian;
        var force = joystick.force < 1 ? joystick.force : 1;
        var x = Math.cos(angle) * force;
        var z = Math.sin(angle) * force;
        this.el.sceneEl.emit("move", { axis: [x, z] });
      } else {
        this.el.sceneEl.emit("move", { axis: [0, 0] });
      }
    } else {
      if (event.type === "move") {
        // Set pitch and yaw angles on right stick move
        const angle = joystick.angle.radian;
        const force = joystick.force < 1 ? joystick.force : 1;
        this.yaw = Math.cos(angle) * force;
        this.el.sceneEl.emit("rotateY", { value: this.yaw });
      } else {
        this.yaw = 0;
        this.el.sceneEl.emit("rotateY", { value: this.yaw });
      }
    }
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
