import { paths } from "./userinput/paths";
const qs = new URLSearchParams(location.search);
const IDLE_TIMEOUT_MS = (parseInt(qs.get("idle_timeout"), 10) || 2 * 60 * 60) * 1000;
const INPUT_CHECK_INTERVAL_MS = 1000;

const CHARACTER_ACCELERATION_PATH = paths.actions.characterAcceleration;
const BASIC_ACTIVITY_PATHS = [
  paths.actions.startGazeTeleport,
  paths.actions.rightHand.startTeleport,
  paths.actions.leftHand.startTeleport,
  paths.actions.snapRotateRight,
  paths.actions.snapRotateLeft,
  paths.actions.cursor.right.grab,
  paths.actions.cursor.left.grab,
  paths.actions.rightHand.grab,
  paths.actions.leftHand.grab,
  paths.actions.angularVelocity
];

let idleTimeout = null;
const lastInputCheck = 0;

const onIdleTimeout = () => {
  window.dispatchEvent(new CustomEvent("idle_detected"));
};

const resetTimeout = () => {
  if (idleTimeout) clearTimeout(idleTimeout);
  idleTimeout = setTimeout(onIdleTimeout, IDLE_TIMEOUT_MS);
  window.dispatchEvent(new CustomEvent("activity_detected"));
};

for (const event of ["click", "pointerdown", "touchstart", "keyup"]) {
  window.addEventListener(event, resetTimeout);
}

resetTimeout();

export const idleDetectSystem = time => {
  // TODO: When should lastInputCheck be updated?
  if (time - lastInputCheck < INPUT_CHECK_INTERVAL_MS) return;

  // TODO: Remove the dependency with AFRAME
  const userinput = AFRAME.scenes[0].systems.userinput;

  let basicActivity = false;
  for (const activityPath of BASIC_ACTIVITY_PATHS) {
    basicActivity = basicActivity || !!userinput.get(activityPath);
  }

  const characterAcceleration = userinput.get(CHARACTER_ACCELERATION_PATH);

  const active =
    basicActivity ||
    !!(characterAcceleration && characterAcceleration[0]) ||
    !!(characterAcceleration && characterAcceleration[1]);

  if (active) {
    resetTimeout();
  }
};
