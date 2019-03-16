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
    this.grabbedPen = null;
    this.cursor = document.querySelector("#cursor");
    this.weWantToGrab = false;
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
      const removePen = userinput.get(paths.actions.pen.remove);

      let didGrabEndThisFrame = false;
      if (drop && this.grabbedUI) {
        this.grabbedUI.emit("grab-end", { hand: this.cursor });
        this.grabbedUI = null;
        didGrabEndThisFrame = true;
      }

      if (this.rightRemoteConstraintTarget) {
        this.rightRemoteConstraintTarget.object3D.matrixNeedsUpdate = true;

        if (drop) {
          const stickyObject = this.rightRemoteConstraintTarget.components["sticky-object"];
          if (stickyObject) {
            stickyObject.onRelease();
          }

          const superNetworkedInteractable = this.rightRemoteHoverTarget.components["super-networked-interactable"];
          if (superNetworkedInteractable) {
            superNetworkedInteractable.onGrabEnd(this.cursor);
          }

          if (this.grabbedPen) {
            this.grabbedPen.children[0].components["pen"].grabberId = null;
            this.grabbedPen = null;
          }

          if (!didGrabEndThisFrame) {
            this.rightRemoteConstraintTarget.emit("grab-end", { hand: this.cursor });
            didGrabEndThisFrame = true;
          }
          this.rightRemoteConstraintTarget.removeAttribute("ammo-constraint");
          this.rightRemoteConstraintTarget = null;
        }
      } else {
        if (this.rightRemoteHoverTarget) {
          const grab = userinput.get(paths.actions.cursor.grab);
          if (grab || this.weWantToGrab) {
            this.weWantToGrab = false;
            const isUI = this.rightRemoteHoverTarget.components["is-ui"];
            if (isUI) {
              this.grabbedUI = this.rightRemoteHoverTarget;
            }

            const isPen = this.rightRemoteHoverTarget.components["is-pen"];
            if (isPen) {
              this.rightRemoteHoverTarget.children[0].components["pen"].grabberId = "cursor";
              this.grabbedPen = this.rightRemoteHoverTarget;
            }

            const offersRemoteConstraint = this.rightRemoteHoverTarget.components["offers-remote-constraint"];
            if (offersRemoteConstraint) {
              this.rightRemoteConstraintTarget = this.rightRemoteHoverTarget;
              this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });

              const stickyObject = this.rightRemoteHoverTarget.components["sticky-object"];
              if (stickyObject) {
                stickyObject.onGrab();
              }
              const superNetworkedInteractable = this.rightRemoteHoverTarget.components["super-networked-interactable"];
              if (superNetworkedInteractable) {
                superNetworkedInteractable.grabberId = "cursor";
                superNetworkedInteractable.onGrabStart(this.cursor);
              }
            }
            if (isUI || isPen || offersRemoteConstraint) {
              this.rightRemoteHoverTarget.emit("grab-start", { hand: this.cursor });
            }
          }
        }
      }
    };
  })()
});
