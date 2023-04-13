import { CAMERA_MODE_FIRST_PERSON } from "../systems/camera-system";
import { isLockedDownDemoRoom } from "../utils/hub-utils";
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
    yawCutoff: { default: 50 } // yaw degrees at wich the hud should reoirent even if the user is looking up
  },
  init() {
    this.onChildHovered = this.onChildHovered.bind(this);
    this.removeHoverEvents = this.removeHoverEvents.bind(this);
    this.isYLocked = false;
    this.lockedHeadPositionY = 0;
    this.lookDir = new THREE.Vector3();
    this.lookEuler = new THREE.Euler();
    this.store = window.APP.store;
    this.hoverableChildren = this.el.querySelectorAll("[is-remote-hover-target]");
  },

  tick() {
    const hud = this.el.object3D;
    const head = this.data.head.object3DMap.camera;

    const { offset, lookCutoff, animRange, yawCutoff } = this.data;

    const pitch = head.rotation.x * THREE.MathUtils.RAD2DEG;
    const yawDif = deltaAngle(head.rotation.y, hud.rotation.y) * THREE.MathUtils.RAD2DEG;

    // HUD is always visible until first hover, to increase discoverability.
    const forceHudVisible = !this.store.state.activity.hasHoveredInWorldHud;

    // animate the hud into place over animRange degrees as the user aproaches the lookCutoff angle
    let t = 1 - THREE.MathUtils.clamp(lookCutoff - pitch, 0, animRange) / animRange;

    // HUD is locked down while showing tooltip or if forced.
    if (forceHudVisible) {
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
    hud.visible =
      (!hudOutOfView || forceHudVisible) &&
      this.el.sceneEl.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_FIRST_PERSON &&
      !isLockedDownDemoRoom();
    hud.position.y = (this.isYLocked ? this.lockedHeadPositionY : head.position.y) + offset + (1 - t) * offset;
    hud.rotation.x = (1 - t) * THREE.MathUtils.DEG2RAD * 90;
    hud.matrixNeedsUpdate = true;
  },

  play() {
    for (let i = 0; i < this.hoverableChildren.length; i++) {
      this.hoverableChildren[i].object3D.addEventListener("hovered", this.onChildHovered);
    }
  },

  pause() {
    this.removeHoverEvents();
  },

  removeHoverEvents() {
    for (let i = 0; i < this.hoverableChildren.length; i++) {
      this.hoverableChildren[i].object3D.removeEventListener("hovered", this.onChildHovered);
    }
  },

  onChildHovered() {
    if (!this.store.state.activity.hasHoveredInWorldHud) {
      this.store.update({ activity: { hasHoveredInWorldHud: true } });
      this.removeHoverEvents();
    }
  }
});
