import { paths } from "./userinput/paths";
const IDLE_TIMEOUT_MS = 20 * 1000;
const INPUT_CHECK_INTERVAL_MS = 1000;

AFRAME.registerSystem("idle-detector", {
  init() {
    this.resetTimeout = this.resetTimeout.bind(this);
    this.idleTimeout = null;
    this.lastInputCheck = 0;

    const events = ["click", "pointerdown", "touchstart", "keyup"];

    for (const event of events) {
      window.addEventListener(event, this.resetTimeout);
    }

    this.resetTimeout();
  },
  resetTimeout() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(this.onIdleTimeout, IDLE_TIMEOUT_MS);
    window.dispatchEvent(new CustomEvent("activity_detected"));
  },
  onIdleTimeout() {
    window.dispatchEvent(new CustomEvent("idle_detected"));
  },
  tick(time) {
    if (time - this.lastInputCheck < INPUT_CHECK_INTERVAL_MS) return;

    const userinput = this.el.systems.userinput;
    const characterAcceleration = userinput.get(paths.actions.characterAcceleration);

    const active =
      userinput.get(paths.actions.startGazeTeleport) ||
      userinput.get(paths.actions.rightHand.startTeleport) ||
      userinput.get(paths.actions.leftHand.startTeleport) ||
      userinput.get(paths.actions.snapRotateRight) ||
      userinput.get(paths.actions.snapRotateLeft) ||
      userinput.get(paths.actions.cursor.right.grab) ||
      userinput.get(paths.actions.cursor.left.grab) ||
      userinput.get(paths.actions.rightHand.grab) ||
      userinput.get(paths.actions.leftHand.grab) ||
      !!(characterAcceleration && characterAcceleration[0]) ||
      !!(characterAcceleration && characterAcceleration[1]) ||
      !!userinput.get(paths.actions.angularVelocity);

    if (active) {
      this.resetTimeout();
    }
  },
  remove() {}
});
