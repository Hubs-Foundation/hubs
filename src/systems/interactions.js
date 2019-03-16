import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";
const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

AFRAME.registerComponent("offers-remote-constraint", {});
AFRAME.registerComponent("is-ui", {});
AFRAME.registerComponent("is-pen", {});

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
    this.grabbedUI = null;
    this.cursor = document.querySelector("#cursor");
  },
  updateCursorIntersections: function(raw) {
    const hasIntersection = raw[0];
    const hoverTarget = hasIntersection && findRemoteHoverTarget(raw[0].object);
    if (!hasIntersection || !hoverTarget) {
      if (this.rightRemoteHoverTarget) {
        this.rightRemoteHoverTarget.removeState("hovered");
        this.rightRemoteHoverTarget = null;
      }
      return;
    }

    if (this.rightRemoteHoverTarget && hoverTarget !== this.rightRemoteHoverTarget) {
      this.rightRemoteHoverTarget.removeState("hovered");
    }
    hoverTarget.addState("hovered");
    this.rightRemoteHoverTarget = hoverTarget;
  },

  tick: (function() {
    return function() {
      const userinput = AFRAME.scenes[0].systems.userinput;
      const drop = userinput.get(paths.actions.cursor.drop);
      const grab = userinput.get(paths.actions.cursor.grab);

      if (drop && this.grabbedUI) {
        this.grabbedUI.emit("grab-end", { hand: this.cursor });
        this.grabbedUI = null;
      }
      if (this.rightRemoteConstraintTarget) {
        this.rightRemoteConstraintTarget.object3D.matrixNeedsUpdate = true;

        if (drop) {
          const stickyObject = this.rightRemoteConstraintTarget.components["sticky-object"];
          if (stickyObject) {
            stickyObject.onRelease();
          }

          this.rightRemoteConstraintTarget.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
          this.rightRemoteConstraintTarget.removeAttribute("ammo-constraint");
          this.rightRemoteConstraintTarget = null;
        }
      } else {
        if (this.rightRemoteHoverTarget) {
          const grab = userinput.get(paths.actions.cursor.grab);
          if (grab) {
            const isUI = this.rightRemoteHoverTarget.components["is-ui"];
            if (isUI) {
              this.rightRemoteHoverTarget.emit("grab-start", { hand: this.cursor });
              this.grabbedUI = this.rightRemoteHoverTarget;
            }

            const offersRemoteConstraint = this.rightRemoteHoverTarget.components["offers-remote-constraint"];
            if (offersRemoteConstraint) {
              this.rightRemoteConstraintTarget = this.rightRemoteHoverTarget;
              this.rightRemoteConstraintTarget.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
              this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });

              const stickyObject = this.rightRemoteHoverTarget.components["sticky-object"];
              if (stickyObject) {
                stickyObject.onGrab();
              }
            }
          }
        }
      }
    };
  })()
});
