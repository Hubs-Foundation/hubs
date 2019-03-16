import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";
const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

AFRAME.registerComponent("offers-remote-constraint", {});
AFRAME.registerComponent("is-ui", {});

const THREEJS_HOVER_TARGETS = new Map();
function findRemoteHoverTarget(o) {
    if (!o) return null;
    const target = THREEJS_HOVER_TARGETS.get(o.uuid);
    return target || findRemoteHoverTarget(o.parent);
}
AFRAME.registerComponent("is-remote-hover-target", {
  init: function() {
    THREEJS_HOVER_TARGETS.set(this.el.object3D.uuid, this.el);
  }
});

AFRAME.registerSystem("interaction", {
  init: function() {
    this.rightRemoteHoverTarget = null;
    this.rightRemoteConstraintTarget = null;
  },
  updateCursorIntersections: function(raw) {
    if (!raw[0]) {
      this.rightRemoteHoverTarget = null;
      return;
    }
    this.rightRemoteHoverTarget = findRemoteHoverTarget(raw[0].object);
  },

  tick: (function() {
    return function() {
      const userinput = AFRAME.scenes[0].systems.userinput;
      if (this.rightRemoteConstraintTarget) {
        this.rightRemoteConstraintTarget.object3D.matrixNeedsUpdate = true;

        if (userinput.get(paths.actions.cursor.drop)) {
          this.rightRemoteConstraintTarget.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
          this.rightRemoteConstraintTarget.removeAttribute("ammo-constraint");
          this.rightRemoteConstraintTarget = null;
        }
      } else {
        if (this.rightRemoteHoverTarget && this.rightRemoteHoverTarget.components["offers-remote-constraint"]) {
          const grab = userinput.get(paths.actions.cursor.grab);
          if (grab) {
            this.rightRemoteConstraintTarget = this.rightRemoteHoverTarget;
            this.rightRemoteConstraintTarget.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
            this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });
          }
        }
      }
    };
  })()
});
