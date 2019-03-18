import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";
const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

AFRAME.registerComponent("offers-remote-constraint", {});
AFRAME.registerComponent("is-ui", {});
AFRAME.registerComponent("is-pen", {});

AFRAME.registerSystem("interaction", {
  init: function() {
    this.rightRemoteConstraintTarget = null;
    this.grabbedUI = null;
    this.grabbedPen = null;
    this.cursor = document.querySelector("#cursor");
    this.weWantToGrab = false;
  },

  tick: function() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const drop = userinput.get(paths.actions.cursor.drop);
    const grab = userinput.get(paths.actions.cursor.grab);
    this.cursorController =
      this.cursorController ||
      (document.querySelector("#cursor-controller") &&
        document.querySelector("#cursor-controller").components["cursor-controller"]);
    const rightRemoteHoverTarget = this.cursorController.rightRemoteHoverTarget;

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

        const superNetworkedInteractable = rightRemoteHoverTarget.components["super-networked-interactable"];
        if (superNetworkedInteractable) {
          superNetworkedInteractable.onGrabEnd(this.cursor);
        }

        if (this.grabbedPen) {
          this.grabbedPen.children[0].components["pen"].grabberId = null;
          this.grabbedPen = null;
        }

        const isSuperSpawner = rightRemoteHoverTarget.components["super-spawner"];
        if (isSuperSpawner && !didGrabEndThisFrame) {
          this.rightRemoteConstraintTarget.emit("grab-end", { hand: this.cursor });
          didGrabEndThisFrame = true;
        }

        this.rightRemoteConstraintTarget.removeAttribute("ammo-constraint");
        this.rightRemoteConstraintTarget = null;
      }
    } else {
      if (rightRemoteHoverTarget && (grab || this.weWantToGrab)) {
        this.weWantToGrab = false;
        const isUI = rightRemoteHoverTarget.components["is-ui"];
        if (isUI) {
          this.grabbedUI = rightRemoteHoverTarget;
        }

        const isPen = rightRemoteHoverTarget.components["is-pen"];
        if (isPen) {
          rightRemoteHoverTarget.children[0].components["pen"].grabberId = "cursor";
          this.grabbedPen = rightRemoteHoverTarget;
        }

        const offersRemoteConstraint = rightRemoteHoverTarget.components["offers-remote-constraint"];
        if (offersRemoteConstraint) {
          this.rightRemoteConstraintTarget = rightRemoteHoverTarget;
          this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });

          const stickyObject = rightRemoteHoverTarget.components["sticky-object"];
          if (stickyObject) {
            stickyObject.onGrab();
          }
          const superNetworkedInteractable = rightRemoteHoverTarget.components["super-networked-interactable"];
          if (superNetworkedInteractable) {
            superNetworkedInteractable.grabberId = "cursor";
            superNetworkedInteractable.onGrabStart(this.cursor);
          }
        }

        const isSuperSpawner = rightRemoteHoverTarget.components["super-spawner"];
        if (isUI || isSuperSpawner) {
          rightRemoteHoverTarget.emit("grab-start", { hand: this.cursor });
        }
      }
    }
  }
});
