import nipplejs from "nipplejs";
import styles from "./virtual-gamepad-controls.css";

/**
 * Instantiates 2D virtual gamepads and emits associated events.
 * @namespace user-input
 * @component virtual-gamepad-controls
 */
AFRAME.registerComponent("virtual-gamepad-controls", {
  schema: {},

  init() {
    this.onEnterVr = this.onEnterVr.bind(this);
    this.onExitVr = this.onExitVr.bind(this);
    this.onFirstInteraction = this.onFirstInteraction.bind(this);
    this.onMoveJoystickChanged = this.onMoveJoystickChanged.bind(this);
    this.onMoveJoystickEnd = this.onMoveJoystickEnd.bind(this);
    this.onLookJoystickChanged = this.onLookJoystickChanged.bind(this);
    this.onLookJoystickEnd = this.onLookJoystickEnd.bind(this);

    this.mockJoystickContainer = document.createElement("div");
    this.mockJoystickContainer.classList.add(styles.mockJoystickContainer);
    const leftMock = document.createElement("div");
    leftMock.classList.add(styles.mockJoystick);
    const leftMockSmall = document.createElement("div");
    leftMockSmall.classList.add(styles.mockJoystick, styles.inner);
    leftMock.appendChild(leftMockSmall);
    this.mockJoystickContainer.appendChild(leftMock);
    const rightMock = document.createElement("div");
    rightMock.classList.add(styles.mockJoystick);
    const rightMockSmall = document.createElement("div");
    rightMockSmall.classList.add(styles.mockJoystick, styles.inner);
    rightMock.appendChild(rightMockSmall);
    this.mockJoystickContainer.appendChild(rightMock);
    document.body.appendChild(this.mockJoystickContainer);

    // Setup gamepad elements
    const leftTouchZone = document.createElement("div");
    leftTouchZone.classList.add(styles.touchZone, styles.left);
    document.body.appendChild(leftTouchZone);

    this.leftTouchZone = leftTouchZone;

    this.leftStick = nipplejs.create({
      zone: this.leftTouchZone,
      color: "white",
      fadeTime: 0
    });

    this.leftStick.on("start", this.onFirstInteraction);
    this.leftStick.on("move", this.onMoveJoystickChanged);
    this.leftStick.on("end", this.onMoveJoystickEnd);

    const rightTouchZone = document.createElement("div");
    rightTouchZone.classList.add(styles.touchZone, styles.right);
    document.body.appendChild(rightTouchZone);

    this.rightTouchZone = rightTouchZone;

    this.rightStick = nipplejs.create({
      zone: this.rightTouchZone,
      color: "white",
      fadeTime: 0
    });

    this.rightStick.on("start", this.onFirstInteraction);
    this.rightStick.on("move", this.onLookJoystickChanged);
    this.rightStick.on("end", this.onLookJoystickEnd);

    this.inVr = false;
    this.moving = false;
    this.rotating = false;

    this.moveEvent = {
      axis: [0, 0]
    };
    this.rotateYEvent = {
      value: 0
    };
    this.rotateXEvent = {
      value: 0
    };

    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVr);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVr);
  },

  onFirstInteraction() {
    this.leftStick.off("start", this.onFirstInteraction);
    this.rightStick.off("start", this.onFirstInteraction);
    document.body.removeChild(this.mockJoystickContainer);
  },

  onMoveJoystickChanged(event, joystick) {
    const angle = joystick.angle.radian;
    const force = joystick.force < 1 ? joystick.force : 1;
    const moveStrength = 1.85;
    const x = Math.cos(angle) * force * moveStrength;
    const z = Math.sin(angle) * force * moveStrength;
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
    const turnStrength = 0.5;
    this.rotating = true;
    this.rotateYEvent.value = Math.cos(angle) * force * turnStrength;
    this.rotateXEvent.value = Math.sin(angle) * force * turnStrength;
  },

  onLookJoystickEnd() {
    this.rotating = false;
    this.rotateYEvent.value = 0;
    this.rotateXEvent.value = 0;
    this.el.sceneEl.emit("rotateY", this.rotateYEvent);
    this.el.sceneEl.emit("rotateX", this.rotateXEvent);
  },

  tick() {
    if (!this.inVr) {
      if (this.moving) {
        this.el.sceneEl.emit("move", this.moveEvent);
      }

      if (this.rotating) {
        this.el.sceneEl.emit("rotateY", this.rotateYEvent);
        this.el.sceneEl.emit("rotateX", this.rotateXEvent);
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
    document.body.removeChild(this.mockJoystickContainer);
    document.body.removeChild(this.leftTouchZone);
    document.body.removeChild(this.rightTouchZone);
  }
});
