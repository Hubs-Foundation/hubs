import { AppModes } from "../systems/app-mode.js";

const TWOPI = Math.PI * 2;
function deltaAngle(a, b) {
  const p = Math.abs(b - a) % TWOPI;
  return p > Math.PI ? TWOPI - p : p;
}

/**
 * Positions the HUD and toggles app mode based on where the user is looking
 */
AFRAME.registerComponent("hud-controller", {
  schema: {
    head: { type: "selector" },
    offset: { default: 0.7 }, // distance from hud above head,
    lookCutoff: { default: 20 }, // angle at which the hud should be "on",
    animRange: { default: 30 }, // degrees over which to animate the hud into view
    yawCutoff: { default: 50 } // yaw degrees at wich the hud should reoirent even if the user is looking up
  },
  init() {
    this.isYLocked = false;
    this.lockedHeadPositionY = 0;
  },

  pause() {
    // TODO: this assumes full control over current app mode reguardless of what else might be manipulating it, this is obviously wrong
    const AppModeSystem = this.el.sceneEl.systems["app-mode"];
    AppModeSystem.setMode(AppModes.DEFAULT);
  },

  tick() {
    const hud = this.el.object3D;
    const head = this.data.head.object3D;
    const sceneEl = this.el.sceneEl;

    const { offset, lookCutoff, animRange, yawCutoff } = this.data;

    const pitch = head.rotation.x * THREE.Math.RAD2DEG;
    const yawDif = deltaAngle(head.rotation.y, hud.rotation.y) * THREE.Math.RAD2DEG;

    // Reorient the hud only if the user is looking away from the hud, for right now this arbitrarily means the hud is 1/3 way animated away
    // TODO: come up with better huristics for this that maybe account for the user turning away from the hud "too far", also animate the position so that it doesnt just snap.
    if (yawDif >= yawCutoff || pitch < lookCutoff - animRange / 3) {
      const lookDir = new THREE.Vector3(0, 0, -1);
      lookDir.applyQuaternion(head.quaternion);
      lookDir.add(head.position);
      hud.position.x = lookDir.x;
      hud.position.z = lookDir.z;
      hud.setRotationFromEuler(new THREE.Euler(0, head.rotation.y, 0));
    }

    // animate the hud into place over animRange degrees as the user aproaches the lookCutoff angle
    const t = 1 - THREE.Math.clamp(lookCutoff - pitch, 0, animRange) / animRange;

    // Lock the hud in place relative to a known head position so it doesn't bob up and down
    // with the user's head
    if (!this.isYLocked && t === 1) {
      this.lockedHeadPositionY = head.position.y;
    }
    const EPSILON = 0.001;
    this.isYLocked = t > 1 - EPSILON;

    hud.position.y = (this.isYLocked ? this.lockedHeadPositionY : head.position.y) + offset + (1 - t) * offset;
    hud.rotation.x = (1 - t) * THREE.Math.DEG2RAD * 90;

    // update the app mode when the HUD locks on or off
    // TODO: this assumes full control over current app mode reguardless of what else might be manipulating it, this is obviously wrong
    const AppModeSystem = sceneEl.systems["app-mode"];
    if (pitch > lookCutoff && AppModeSystem.mode !== AppModes.HUD) {
      AppModeSystem.setMode(AppModes.HUD);
      sceneEl.renderer.sortObjects = true;
    } else if (pitch < lookCutoff && AppModeSystem.mode === AppModes.HUD) {
      AppModeSystem.setMode(AppModes.DEFAULT);
      sceneEl.renderer.sortObjects = false;
    }
  }
});
