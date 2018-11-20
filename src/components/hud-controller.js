import { AppModes } from "../systems/app-mode.js";

const TWOPI = Math.PI * 2;
function deltaAngle(a, b) {
  const p = Math.abs(b - a) % TWOPI;
  return p > Math.PI ? TWOPI - p : p;
}

/**
 * Positions the HUD and toggles app mode based on where the user is looking
 * @namespace ui
 * @component hud-controller
 */
AFRAME.registerComponent("hud-controller", {
  schema: {
    head: { type: "selector" },
    offset: { default: 0.7 }, // distance from hud above head,
    lookCutoff: { default: 20 }, // angle at which the hud should be "on",
    animRange: { default: 30 }, // degrees over which to animate the hud into view
    yawCutoff: { default: 50 }, // yaw degrees at wich the hud should reoirent even if the user is looking up
    showTip: { type: "bool" }
  },
  init() {
    this.isYLocked = false;
    this.lockedHeadPositionY = 0;
    this.lookDir = new THREE.Vector3();
    this.lookEuler = new THREE.Euler();
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

    const { offset, lookCutoff, animRange, yawCutoff, showTip } = this.data;

    const pitch = head.rotation.x * THREE.Math.RAD2DEG;
    const yawDif = deltaAngle(head.rotation.y, hud.rotation.y) * THREE.Math.RAD2DEG;

    // animate the hud into place over animRange degrees as the user aproaches the lookCutoff angle
    let t = 1 - THREE.Math.clamp(lookCutoff - pitch, 0, animRange) / animRange;

    // HUD is locked down while showing tooltip
    if (showTip) {
      t = 1;
    }

    // Once the HUD is in place it should stay in place until you look sufficiently far down
    if (t === 1) {
      this.lockedHeadPositionY = head.position.y;
      this.hudLocked = true;
    } else if (this.hudLocked && pitch < lookCutoff - animRange / 2) {
      this.hudLocked = false;
    }

    if (this.hudLocked) {
      t = 1;
    }

    // Reorient the hud only if the user is looking away from the hud, for right now this arbitrarily means the hud is 1/2 way animated away
    // TODO: come up with better huristics for this that maybe account for the user turning away from the hud "too far", also animate the position so that it doesnt just snap.
    const hudOutOfView = yawDif >= yawCutoff || pitch < lookCutoff - animRange / 2;

    if (hudOutOfView) {
      this.lookDir.set(0, 0, -1);
      this.lookDir.applyQuaternion(head.quaternion);
      this.lookDir.add(head.position);
      hud.position.x = this.lookDir.x;
      hud.position.z = this.lookDir.z;
      hud.rotation.copy(head.rotation);
      hud.rotation.x = 0;
      hud.rotation.z = 0;
    }

    hud.visible = !hudOutOfView;
    hud.position.y = (this.isYLocked ? this.lockedHeadPositionY : head.position.y) + offset + (1 - t) * offset;
    hud.rotation.x = (1 - t) * THREE.Math.DEG2RAD * 90;
    hud.matrixNeedsUpdate = true;

    // update the app mode when the HUD locks on or off
    // TODO: this assumes full control over current app mode reguardless of what else might be manipulating it, this is obviously wrong
    const AppModeSystem = sceneEl.systems["app-mode"];
    if (pitch > lookCutoff && AppModeSystem.mode !== AppModes.HUD) {
      AppModeSystem.setMode(AppModes.HUD);
    } else if (pitch < lookCutoff && AppModeSystem.mode === AppModes.HUD) {
      AppModeSystem.setMode(AppModes.DEFAULT);
    }
  }
});
