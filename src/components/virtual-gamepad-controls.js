import nipplejs from "nipplejs";
import styles from "./virtual-gamepad-controls.css";

function insertAfter(el, referenceEl) {
  referenceEl.parentNode.insertBefore(el, referenceEl.nextSibling);
}

const ROTATION_SPEED = 0.025;

/**
 * Instantiates 2D virtual gamepads and emits associated events.
 * @namespace user-input
 * @component virtual-gamepad-controls
 */
AFRAME.registerComponent("virtual-gamepad-controls", {
  schema: {},

  init() {
    this.characterController = this.el.sceneEl.systems["hubs-systems"].characterController;

    this.onEnterVr = this.onEnterVr.bind(this);
    this.onExitVr = this.onExitVr.bind(this);
    this.onFirstInteraction = this.onFirstInteraction.bind(this);
    this.onMoveJoystickChanged = this.onMoveJoystickChanged.bind(this);
    this.onMoveJoystickEnd = this.onMoveJoystickEnd.bind(this);
    this.onLookJoystickChanged = this.onLookJoystickChanged.bind(this);
    this.onLookJoystickEnd = this.onLookJoystickEnd.bind(this);

    this.mockJoystickContainer = document.createElement("div");
    this.mockJoystickContainer.classList.add(styles.mockJoystickContainer);
    this.leftMock = document.createElement("div");
    this.leftMock.classList.add(styles.mockJoystick);
    this.leftMockSmall = document.createElement("div");
    this.leftMockSmall.classList.add(styles.mockJoystick, styles.inner);
    this.leftMock.appendChild(this.leftMockSmall);
    this.mockJoystickContainer.appendChild(this.leftMock);
    this.rightMock = document.createElement("div");
    this.rightMock.classList.add(styles.mockJoystick);
    this.rightMockSmall = document.createElement("div");
    this.rightMockSmall.classList.add(styles.mockJoystick, styles.inner);
    this.rightMock.appendChild(this.rightMockSmall);
    this.mockJoystickContainer.appendChild(this.rightMock);

    this.enableLeft = window.APP.store.state.preferences.enableOnScreenJoystickLeft;
    this.enableRight = window.APP.store.state.preferences.enableOnScreenJoystickRight;
    if (this.enableLeft || this.enableRight) {
      // Add the joystick container after the canvas element but before the rest of the UI.
      insertAfter(this.mockJoystickContainer, this.el.sceneEl.canvas);
    }
    if (this.enableLeft) {
      this.createLeftStick();
    } else {
      this.leftMock.classList.add(styles.hidden);
      this.leftMockSmall.classList.add(styles.hidden);
    }
    if (this.enableRight) {
      this.createRightStick();
    } else {
      this.rightMock.classList.add(styles.hidden);
      this.rightMockSmall.classList.add(styles.hidden);
    }
    this.onPreferenceChange = this.onPreferenceChange.bind(this);
    window.APP.store.addEventListener("statechanged", this.onPreferenceChange);

    this.inVr = false;
    this.moving = false;
    this.rotating = false;

    this.displacement = new THREE.Vector3();
    this.lookDy = 0;
    this.lookDx = 0;

    this.el.sceneEl.addEventListener("enter-vr", this.onEnterVr);
    this.el.sceneEl.addEventListener("exit-vr", this.onExitVr);
  },

  onPreferenceChange() {
    const newEnableLeft = window.APP.store.state.preferences.enableOnScreenJoystickLeft;
    const newEnableRight = window.APP.store.state.preferences.enableOnScreenJoystickRight;
    const isChanged = this.enableLeft !== newEnableLeft || this.enableRight !== newEnableRight;
    if (!isChanged) {
      return;
    }
    if ((newEnableLeft || newEnableRight) && !this.mockJoystickContainer.parentNode) {
      insertAfter(this.mockJoystickContainer, this.el.sceneEl.canvas);
    }
    if (!this.enableLeft && newEnableLeft) {
      this.createLeftStick();
    } else if (this.enableLeft && !newEnableLeft) {
      this.leftMock.classList.add(styles.hidden);
      this.leftMockSmall.classList.add(styles.hidden);
      this.leftStick.destroy();
      this.leftTouchZone.parentNode.removeChild(this.leftTouchZone);
      this.leftStick = null;
      this.leftTouchZone = null;
    }
    if (!this.enableRight && newEnableRight) {
      this.createRightStick();
    } else if (this.enableRight && !newEnableRight) {
      this.rightMock.classList.add(styles.hidden);
      this.rightMockSmall.classList.add(styles.hidden);
      this.rightStick.destroy();
      this.rightTouchZone.parentNode.removeChild(this.rightTouchZone);
      this.rightStick = null;
      this.rightTouchZone = null;
    }
    this.enableLeft = newEnableLeft;
    this.enableRight = newEnableRight;

    if (this.enableLeft) {
      this.leftMock.classList.remove(styles.hidden);
      this.leftMockSmall.classList.remove(styles.hidden);
      this.leftStick.on("start", this.onFirstInteraction);
    }
    if (this.enableRight) {
      this.rightMock.classList.remove(styles.hidden);
      this.rightMockSmall.classList.remove(styles.hidden);
      this.rightStick.on("start", this.onFirstInteraction);
    }
    if (!this.enableLeft && !this.enableRight && this.mockJoystickContainer.parentNode) {
      this.mockJoystickContainer.parentNode.removeChild(this.mockJoystickContainer);
    }
  },

  createRightStick() {
    this.rightTouchZone = document.createElement("div");
    this.rightTouchZone.classList.add(styles.touchZone, styles.right);
    insertAfter(this.rightTouchZone, this.mockJoystickContainer);
    this.rightStick = nipplejs.create({
      mode: "static",
      position: { left: "50%", top: "50%" },
      zone: this.rightTouchZone,
      color: "white",
      fadeTime: 0
    });
    // nipplejs sets z-index 999 but it makes the joysticks
    // visible even if the scene is hidden for example by
    // preference dialog. So remove z-index.
    this.rightStick[0].ui.el.style.removeProperty("z-index");
    this.rightStick.on("start", this.onFirstInteraction);
    this.rightStick.on("move", this.onLookJoystickChanged);
    this.rightStick.on("end", this.onLookJoystickEnd);
  },

  createLeftStick() {
    this.leftTouchZone = document.createElement("div");
    this.leftTouchZone.classList.add(styles.touchZone, styles.left);
    insertAfter(this.leftTouchZone, this.mockJoystickContainer);
    this.leftStick = nipplejs.create({
      mode: "static",
      position: { left: "50%", top: "50%" },
      zone: this.leftTouchZone,
      color: "white",
      fadeTime: 0
    });
    this.leftStick[0].ui.el.style.removeProperty("z-index");
    this.leftStick.on("start", this.onFirstInteraction);
    this.leftStick.on("move", this.onMoveJoystickChanged);
    this.leftStick.on("end", this.onMoveJoystickEnd);
  },

  onFirstInteraction() {
    if (this.leftStick) this.leftStick.off("start", this.onFirstInteraction);
    if (this.rightStick) this.rightStick.off("start", this.onFirstInteraction);
    this.mockJoystickContainer.parentNode &&
      this.mockJoystickContainer.parentNode.removeChild(this.mockJoystickContainer);
  },

  onMoveJoystickChanged(event, joystick) {
    if (window.APP.preferenceScreenIsVisible) return;
    const angle = joystick.angle.radian;
    const force = joystick.force < 1 ? joystick.force : 1;
    this.displacement.set(Math.cos(angle), 0, -Math.sin(angle)).multiplyScalar(force * 1.85);
    this.moving = true;
  },

  onMoveJoystickEnd() {
    this.moving = false;
    this.displacement.set(0, 0, 0);
  },

  onLookJoystickChanged(event, joystick) {
    if (window.APP.preferenceScreenIsVisible) return;
    // Set pitch and yaw angles on right stick move
    const angle = joystick.angle.radian;
    const force = joystick.force < 1 ? joystick.force : 1;
    this.rotating = true;
    this.lookDy = -Math.cos(angle) * force * ROTATION_SPEED;
    this.lookDx = Math.sin(angle) * force * ROTATION_SPEED;
  },

  onLookJoystickEnd() {
    this.rotating = false;
    this.lookDx = 0;
    this.lookDy = 0;
    this.el.sceneEl.emit("rotateX", this.lookDx);
  },

  tick() {
    if (this.inVr) {
      return;
    }
    if (this.moving) {
      this.characterController.enqueueRelativeMotion(this.displacement);
    }
    if (this.rotating) {
      this.characterController.enqueueInPlaceRotationAroundWorldUp(this.lookDy);
      this.el.sceneEl.emit("rotateX", this.lookDx);
    }
  },

  onEnterVr() {
    // Hide the joystick controls
    this.inVr = true;
    if (this.leftTouchZone) this.leftTouchZone.style.display = "none";
    if (this.rightTouchZone) this.rightTouchZone.style.display = "none";
  },

  onExitVr() {
    // Show the joystick controls
    this.inVr = false;
    if (this.leftTouchZone) this.leftTouchZone.style.display = "block";
    if (this.rightTouchZone) this.rightTouchZone.style.display = "block";
  },

  remove() {
    this.el.sceneEl.removeEventListener("entervr", this.onEnterVr);
    this.el.sceneEl.removeEventListener("exitvr", this.onExitVr);
    this.mockJoystickContainer.parentNode &&
      this.mockJoystickContainer.parentNode.removeChild(this.mockJoystickContainer);
    if (this.leftTouchZone) this.leftTouchZone.parentNode.removeChild(this.leftTouchZone);
    if (this.rightTouchZone) this.rightTouchZone.parentNode.removeChild(this.rightTouchZone);
  }
});
