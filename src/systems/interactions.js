import { sets } from "./userinput/sets";
import { waitForEvent } from "../utils/async-utils";
import { paths } from "./userinput/paths";
import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";
const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

function logMat4(mat4) {
  let s = "";
  for (let i = 0; i < 16; i++) {
    s += mat4.elements[i] + " ";
  }
  console.log(s);
}

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

  tick: async function() {
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
        const superSpawner = rightRemoteHoverTarget.components["super-spawner"];
        if (offersRemoteConstraint) {
          this.rightRemoteConstraintTarget = rightRemoteHoverTarget;
          this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });

          const stickyObject = rightRemoteHoverTarget.components["sticky-object"];
          if (stickyObject) {
            stickyObject.onGrab();
          }
          const superNetworkedInteractable = rightRemoteHoverTarget.components["super-networked-interactable"];
          if (superNetworkedInteractable) {
            superNetworkedInteractable.onGrabStart(this.cursor);
          }
        } else if (superSpawner) {
          this.cursor.object3D.updateMatrices();
          this.cursor.object3D.matrix.decompose(
            this.cursor.object3D.position,
            this.cursor.object3D.quaternion,
            this.cursor.object3D.scale
          );
          const data = superSpawner.data;
          const entity = addMedia(data.src, data.template, ObjectContentOrigins.SPAWNER, data.resolve, data.resize)
            .entity;
          entity.object3D.position.copy(
            data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position
          );
          entity.object3D.rotation.copy(
            data.useCustomSpawnRotation ? data.spawnRotation : superSpawner.el.object3D.rotation
          );
          entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
          entity.object3D.matrixNeedsUpdate = true;

          superSpawner.activateCooldown();
          // WARNING: waitForEvent is semantically different than entity.addEventListener("body-loaded", ...)
          // and adding a callback fn via addEventListener will not work unless the callback function
          // wraps its code in setTimeout(()=>{...}, 0)
          await waitForEvent("body-loaded", entity);
          entity.object3D.position.copy(
            data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position
          );
          if (data.centerSpawnedObject) {
            entity.body.position.copy(this.cursor.object3D.position);
          }
          entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
          entity.object3D.matrixNeedsUpdate = true;

          this.rightRemoteConstraintTarget = entity;
          this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });
          const stickyObject = this.rightRemoteConstraintTarget.components["sticky-object"];
          if (stickyObject) {
            stickyObject.onGrab();
          }

          const superNetworkedInteractable = this.rightRemoteConstraintTarget.components[
            "super-networked-interactable"
          ];
          if (superNetworkedInteractable) {
            superNetworkedInteractable.onGrabStart(this.cursor);
          }
          entity.components["ammo-body"].syncToPhysics();
        }
        if (isUI) {
          rightRemoteHoverTarget.emit("grab-start", { hand: this.cursor });
        }
      }
    }
  }
});
