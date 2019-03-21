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

const THREEJS_HAND_COLLISION_TARGETS = new Map();
function findHandCollisionTarget(o) {
  if (!o) return null;
  const target = THREEJS_HAND_COLLISION_TARGETS.get(o.uuid);
  return target || findHandCollisionTarget(o.parent);
}
AFRAME.registerComponent("is-hand-collision-target", {
  init: function() {
    THREEJS_HAND_COLLISION_TARGETS.set(this.el.object3D.uuid, this.el);
  }
});

AFRAME.registerComponent("offers-constraint-when-colliding", {});
AFRAME.registerComponent("offers-remote-constraint", {});
AFRAME.registerComponent("single-action-button", {});
AFRAME.registerComponent("holdable-button", {});
AFRAME.registerComponent("is-pen", {});

function findHandCollisionTargetForBody(body) {
  const driver = AFRAME.scenes[0].systems.physics.driver;
  const collisions = driver.collisions;
  const rightHandPtr = Ammo.getPointer(body);
  for (const key in collisions) {
    const [body0ptr, body1ptr] = collisions[key];
    if (body0ptr === rightHandPtr) {
      return findHandCollisionTarget(driver.els[body1ptr].object3D);
    }
    if (body1ptr === rightHandPtr) {
      return findHandCollisionTarget(driver.els[body0ptr].object3D);
    }
  }
}

AFRAME.registerSystem("interaction", {
  init: function() {
    this.rightRemoteConstraintTarget = null;
    this.grabbedPen = null;
    this.weWantToGrab = false;
  },

  tick: async function() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const rightHandDrop = userinput.get(paths.actions.rightHand.drop);
    const rightHandGrab = userinput.get(paths.actions.rightHand.grab);
    const leftHandDrop = userinput.get(paths.actions.leftHand.drop);
    const leftHandGrab = userinput.get(paths.actions.leftHand.grab);
    const drop = userinput.get(paths.actions.cursor.drop);
    const grab = userinput.get(paths.actions.cursor.grab);
    this.cursor = this.cursor || document.querySelector("#cursor");
    this.cursorController = this.cursorController || document.querySelector("#cursor-controller");
    this.rightHand = this.rightHand || document.querySelector("#player-right-controller");
    this.leftHand = this.leftHand || document.querySelector("#player-left-controller");

    if (this.leftHandConstraintTarget) {
      if (leftHandDrop) {
        const stickyObject = this.leftHandConstraintTarget.components["sticky-object"];
        if (stickyObject) {
          stickyObject.onRelease();
        }

        const superNetworkedInteractable = this.leftHandConstraintTarget.components["super-networked-interactable"];
        if (superNetworkedInteractable) {
          superNetworkedInteractable.onGrabEnd(this.leftHand);
        }

        if (this.penInLeftHand) {
          this.penInLeftHand.children[0].components["pen"].grabberId = null;
          this.penInLeftHand = null;
        }

        this.leftHandConstraintTarget.removeAttribute("ammo-constraint");
        this.leftHandConstraintTarget = null;
      }
    } else {
      this.leftHandCollisionTarget =
        !this.leftRemoteConstraintTarget && findHandCollisionTargetForBody(this.leftHand.body);
      this.cursorController.components["cursor-controller"].enabled = !this.leftHandCollisionTarget;
      if (this.leftHandCollisionTarget) {
        if (leftHandGrab) {
          const isPen = this.leftHandCollisionTarget.components["is-pen"];
          if (isPen) {
            this.leftHandCollisionTarget.children[0].components["pen"].grabberId = "player-left-controller";
            this.penInLeftHand = this.leftHandCollisionTarget;
          }
          const offersCollisionConstraint = this.leftHandCollisionTarget.components[
            "offers-constraint-when-colliding"
          ];
          const superSpawner = this.leftHandCollisionTarget.components["super-spawner"];
          if (offersCollisionConstraint) {
            this.leftHandConstraintTarget = this.leftHandCollisionTarget;
            this.leftHandConstraintTarget.setAttribute("ammo-constraint", { target: "#player-left-controller" });

            const stickyObject = this.leftHandCollisionTarget.components["sticky-object"];
            if (stickyObject) {
              stickyObject.onGrab();
            }
            const superNetworkedInteractable = this.leftHandCollisionTarget.components["super-networked-interactable"];
            if (superNetworkedInteractable) {
              superNetworkedInteractable.onGrabStart(this.leftHand);
            }
          } else if (superSpawner) {
            this.leftHand.object3D.updateMatrices();
            this.leftHand.object3D.matrix.decompose(
              this.leftHand.object3D.position,
              this.leftHand.object3D.quaternion,
              this.leftHand.object3D.scale
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
              entity.body.position.copy(this.leftHand.object3D.position);
            }
            entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
            entity.object3D.matrixNeedsUpdate = true;

            this.leftHandConstraintTarget = entity;
            this.leftHandConstraintTarget.setAttribute("ammo-constraint", { target: "#player-left-controller" });
            const stickyObject = this.leftHandConstraintTarget.components["sticky-object"];
            if (stickyObject) {
              stickyObject.onGrab();
            }

            const superNetworkedInteractable = this.leftHandConstraintTarget.components[
              "super-networked-interactable"
            ];
            if (superNetworkedInteractable) {
              superNetworkedInteractable.onGrabStart(this.leftHand);
            }
            entity.components["ammo-body"].syncToPhysics();
          }
        }
      }
    }

    if (this.rightHandConstraintTarget) {
      if (rightHandDrop) {
        const stickyObject = this.rightHandConstraintTarget.components["sticky-object"];
        if (stickyObject) {
          stickyObject.onRelease();
        }

        const superNetworkedInteractable = this.rightHandConstraintTarget.components["super-networked-interactable"];
        if (superNetworkedInteractable) {
          superNetworkedInteractable.onGrabEnd(this.rightHand);
        }

        if (this.penInRightHand) {
          this.penInRightHand.children[0].components["pen"].grabberId = null;
          this.penInRightHand = null;
        }

        this.rightHandConstraintTarget.removeAttribute("ammo-constraint");
        this.rightHandConstraintTarget = null;
      }
    } else {
      this.rightHandCollisionTarget =
        !this.rightRemoteConstraintTarget && findHandCollisionTargetForBody(this.rightHand.body);
      this.cursorController.components["cursor-controller"].enabled = !this.rightHandCollisionTarget;
      if (this.rightHandCollisionTarget) {
        if (rightHandGrab) {
          const isPen = this.rightHandCollisionTarget.components["is-pen"];
          if (isPen) {
            this.rightHandCollisionTarget.children[0].components["pen"].grabberId = "player-right-controller";
            this.penInRightHand = this.rightHandCollisionTarget;
          }
          const offersCollisionConstraint = this.rightHandCollisionTarget.components[
            "offers-constraint-when-colliding"
          ];
          const superSpawner = this.rightHandCollisionTarget.components["super-spawner"];
          if (offersCollisionConstraint) {
            this.rightHandConstraintTarget = this.rightHandCollisionTarget;
            this.rightHandConstraintTarget.setAttribute("ammo-constraint", { target: "#player-right-controller" });

            const stickyObject = this.rightHandCollisionTarget.components["sticky-object"];
            if (stickyObject) {
              stickyObject.onGrab();
            }
            const superNetworkedInteractable = this.rightHandCollisionTarget.components["super-networked-interactable"];
            if (superNetworkedInteractable) {
              superNetworkedInteractable.onGrabStart(this.rightHand);
            }
          } else if (superSpawner) {
            this.rightHand.object3D.updateMatrices();
            this.rightHand.object3D.matrix.decompose(
              this.rightHand.object3D.position,
              this.rightHand.object3D.quaternion,
              this.rightHand.object3D.scale
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
              entity.body.position.copy(this.rightHand.object3D.position);
            }
            entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
            entity.object3D.matrixNeedsUpdate = true;

            this.rightHandConstraintTarget = entity;
            this.rightHandConstraintTarget.setAttribute("ammo-constraint", { target: "#player-right-controller" });
            const stickyObject = this.rightHandConstraintTarget.components["sticky-object"];
            if (stickyObject) {
              stickyObject.onGrab();
            }

            const superNetworkedInteractable = this.rightHandConstraintTarget.components[
              "super-networked-interactable"
            ];
            if (superNetworkedInteractable) {
              superNetworkedInteractable.onGrabStart(this.rightHand);
            }
            entity.components["ammo-body"].syncToPhysics();
          }
        }
      }
    }

    const rightRemoteHoverTarget =
      !this.rightHandCollisionTarget && this.cursorController.components["cursor-controller"].rightRemoteHoverTarget;
    this.rightRemoteHoverTarget = rightRemoteHoverTarget;

    if (this.buttonHeldByRightRemote && drop) {
      this.buttonHeldByRightRemote.el.object3D.dispatchEvent({
        type: "holdable-button-up",
        path: paths.actions.cursor.drop
      });
      this.buttonHeldByRightRemote = null;
    }

    if (this.rightRemoteConstraintTarget) {
      if (drop) {
        const stickyObject = this.rightRemoteConstraintTarget.components["sticky-object"];
        if (stickyObject) {
          stickyObject.onRelease();
        }

        const superNetworkedInteractable = this.rightRemoteConstraintTarget.components["super-networked-interactable"];
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
        const singleActionButton = rightRemoteHoverTarget.components["single-action-button"];
        if (singleActionButton) {
          singleActionButton.el.object3D.dispatchEvent({ type: "interact", path: paths.actions.cursor.grab });
        }

        const holdableButton = rightRemoteHoverTarget.components["holdable-button"];
        if (holdableButton) {
          this.buttonHeldByRightRemote = holdableButton;
          holdableButton.el.object3D.dispatchEvent({ type: "holdable-button-down", path: paths.actions.cursor.grab });
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
      }
    }
  }
});
