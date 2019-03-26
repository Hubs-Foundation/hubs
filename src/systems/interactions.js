/* global AFRAME Ammo NAF MutationObserver require */
import { waitForEvent } from "../utils/async-utils";
import { paths } from "./userinput/paths";
import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

export const EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT = "constraint-creation-attempt";
export const EVENT_TYPE_CONSTRAINT_REMOVAL = "constraint-removal";
export const RIGHT_HAND_CONSTRAINER = "right-hand";
export const LEFT_HAND_CONSTRAINER = "left-hand";
export const RIGHT_REMOTE_CONSTRAINER = "right-remote";

const UNHOVERED_EVENT = { type: "unhovered" };
const HOVERED_EVENT = { type: "hovered" };
const RIGHT_HAND_CONSTRAINT_CREATION_ATTEMPT_EVENT = {
  type: EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT,
  constrainer: RIGHT_HAND_CONSTRAINER
};
const LEFT_HAND_CONSTRAINT_CREATION_ATTEMPT_EVENT = {
  type: EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT,
  constrainer: LEFT_HAND_CONSTRAINER
};
const RIGHT_REMOTE_CONSTRAINT_CREATION_ATTEMPT_EVENT = {
  type: EVENT_TYPE_CONSTRAINT_CREATION_ATTEMPT,
  constrainer: RIGHT_REMOTE_CONSTRAINER
};
const RIGHT_HAND_CONSTRAINT_REMOVAL_EVENT = {
  type: EVENT_TYPE_CONSTRAINT_REMOVAL,
  constrainer: RIGHT_HAND_CONSTRAINER
};
const LEFT_HAND_CONSTRAINT_REMOVAL_EVENT = {
  type: EVENT_TYPE_CONSTRAINT_REMOVAL,
  constrainer: LEFT_HAND_CONSTRAINER
};
const RIGHT_REMOTE_CONSTRAINT_REMOVAL_EVENT = {
  type: EVENT_TYPE_CONSTRAINT_REMOVAL,
  constrainer: RIGHT_REMOTE_CONSTRAINER
};

AFRAME.registerComponent("offers-constraint-when-colliding", {});
AFRAME.registerComponent("offers-remote-constraint", {});
AFRAME.registerComponent("single-action-button", {});
AFRAME.registerComponent("holdable-button", {});
AFRAME.registerComponent("is-pen", {});

const handCollisionTargets = new Map();
AFRAME.registerComponent("is-hand-collision-target", {
  init: function() {
    handCollisionTargets.set(this.el.object3D.uuid, this.el);
  }
});
function findHandCollisionTarget(o) {
  if (!o) return null;
  const target = handCollisionTargets.get(o.uuid);
  return target || findHandCollisionTarget(o.parent);
}
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

const remoteHoverTargets = new Map();
function findRemoteHoverTarget(o) {
  if (!o) return null;
  const target = remoteHoverTargets.get(o.uuid);
  return target || findRemoteHoverTarget(o.parent);
}
AFRAME.registerComponent("is-remote-hover-target", {
  init: function() {
    remoteHoverTargets.set(this.el.object3D.uuid, this.el);
  }
});

class CursorTargettingSystem {
  constructor() {
    this.targets = [];
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;
    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.setDirty);
    const scene = document.querySelector("a-scene");
    this.observer.observe(scene, { childList: true, attributes: true, subtree: true });
    scene.addEventListener("object3dset", this.setDirty);
    scene.addEventListener("object3dremove", this.setDirty);
  }

  setDirty() {
    this.dirty = true;
  }

  tick() {
    if (this.dirty) {
      this.populateEntities(this.targets);
      this.dirty = false;
    }
  }

  populateEntities(targets) {
    targets.length = 0;
    // TODO: Do not querySelectorAll on the entire scene every time anything changes!
    const els = AFRAME.scenes[0].querySelectorAll(".collidable, .interactable, .ui");
    for (let i = 0; i < els.length; i++) {
      if (els[i].object3D) {
        targets.push(els[i].object3D);
      }
    }
  }

  remove() {
    this.observer.disconnect();
    AFRAME.scenes[0].removeEventListener("object3dset", this.setDirty);
    AFRAME.scenes[0].removeEventListener("object3dremove", this.setDirty);
  }
}

AFRAME.registerSystem("interaction", {
  updateCursorIntersection: function(intersection) {
    const hoverTarget = intersection && findRemoteHoverTarget(intersection.object);
    if (!hoverTarget) {
      if (this.rightRemoteHoverTarget) {
        this.rightRemoteHoverTarget.object3D.dispatchEvent(UNHOVERED_EVENT);
        this.rightRemoteHoverTarget = null;
      }
      return;
    }

    if (!this.rightRemoteHoverTarget) {
      this.rightRemoteHoverTarget = hoverTarget;
      this.rightRemoteHoverTarget.object3D.dispatchEvent(HOVERED_EVENT);
    } else if (hoverTarget !== this.rightRemoteHoverTarget) {
      this.rightRemoteHoverTarget.object3D.dispatchEvent(UNHOVERED_EVENT);
      this.rightRemoteHoverTarget = hoverTarget;
      this.rightRemoteHoverTarget.object3D.dispatchEvent(HOVERED_EVENT);
    }
  },

  async spawnObjectRoutine(constraintObject3D, superSpawner, constraintTarget, event) {
    constraintObject3D.updateMatrices();
    constraintObject3D.matrix.decompose(
      constraintObject3D.position,
      constraintObject3D.quaternion,
      constraintObject3D.scale
    );
    const data = superSpawner.data;
    const entity = addMedia(data.src, data.template, ObjectContentOrigins.SPAWNER, data.resolve, data.resize).entity;
    entity.object3D.position.copy(data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position);
    entity.object3D.rotation.copy(data.useCustomSpawnRotation ? data.spawnRotation : superSpawner.el.object3D.rotation);
    entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    entity.object3D.matrixNeedsUpdate = true;

    superSpawner.activateCooldown();
    // WARNING: waitForEvent is semantically different than entity.addEventListener("body-loaded", ...)
    // and adding a callback fn via addEventListener will not work unless the callback function
    // wraps its code in setTimeout(()=>{...}, 0)
    await waitForEvent("body-loaded", entity);
    entity.object3D.position.copy(data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position);
    if (data.centerSpawnedObject) {
      entity.body.position.copy(constraintObject3D.position);
    }
    entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    entity.object3D.matrixNeedsUpdate = true;

    if (constraintTarget === "#player-left-controller") {
      this.leftHandConstraintTarget = entity;
    } else if (constraintTarget === "#player-right-controller") {
      this.rightHandConstraintTarget = entity;
    } else if (constraintTarget === "#cursor") {
      this.rightRemoteConstraintTarget = entity;
    }
    // We don't bother trying to obtain ownership because we assume we have it
    entity.setAttribute("ammo-constraint", { target: constraintTarget });
    entity.object3D.dispatchEvent(event);
    entity.components["ammo-body"].syncToPhysics();
  },

  init: function() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.rightRemoteConstraintTarget = null;
    this.weWantToGrab = false;
  },

  tick: async function() {
    this.cursorTargettingSystem.tick();
    const userinput = AFRAME.scenes[0].systems.userinput;
    const rightHandDrop = userinput.get(paths.actions.rightHand.drop);
    const rightHandGrab = userinput.get(paths.actions.rightHand.grab);
    const leftHandDrop = userinput.get(paths.actions.leftHand.drop);
    const leftHandGrab = userinput.get(paths.actions.leftHand.grab);
    const rightRemoteDrop = userinput.get(paths.actions.cursor.drop);
    const rightRemoteGrab = userinput.get(paths.actions.cursor.grab);
    this.cursor = this.cursor || document.querySelector("#cursor");
    this.cursorController = this.cursorController || document.querySelector("#cursor-controller");
    this.rightHand = this.rightHand || document.querySelector("#player-right-controller");
    this.leftHand = this.leftHand || document.querySelector("#player-left-controller");
    this.rightHandTeleporter = this.rightHand.components["teleporter"];

    if (this.leftHandConstraintTarget) {
      const networked = this.leftHandConstraintTarget.components["networked"];
      const lostOwnership = networked && networked.data.owner !== NAF.clientId;
      if (leftHandDrop || lostOwnership) {
        this.leftHandConstraintTarget.removeAttribute("ammo-constraint");
        if (lostOwnership) {
          this.leftHandConstraintTarget.setAttribute("ammo-body", { type: "kinematic" });
        }

        this.leftHandConstraintTarget.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
        this.leftHandConstraintTarget.object3D.dispatchEvent(LEFT_HAND_CONSTRAINT_REMOVAL_EVENT);
        this.leftHandConstraintTarget = null;
      }
    } else {
      this.leftHandCollisionTarget =
        !this.leftRemoteConstraintTarget && findHandCollisionTargetForBody(this.leftHand.body);

      if (this.leftHandCollisionTarget) {
        if (leftHandGrab) {
          const offersCollisionConstraint = this.leftHandCollisionTarget.components["offers-constraint-when-colliding"];
          const superSpawner = this.leftHandCollisionTarget.components["super-spawner"];
          if (offersCollisionConstraint) {
            if (
              !this.leftHandCollisionTarget.components["networked"] ||
              NAF.utils.isMine(this.leftHandCollisionTarget) ||
              NAF.utils.takeOwnership(this.leftHandCollisionTarget)
            ) {
              this.leftHandConstraintTarget = this.leftHandCollisionTarget;
              this.leftHandConstraintTarget.setAttribute("ammo-body", { type: "dynamic" });
              this.leftHandConstraintTarget.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
              this.leftHandConstraintTarget.setAttribute("ammo-constraint", { target: "#player-left-controller" });
              this.leftHandConstraintTarget.object3D.dispatchEvent(LEFT_HAND_CONSTRAINT_CREATION_ATTEMPT_EVENT);
            } else {
              //TODO: communicate a failure to obtain network ownership
            }
          } else if (superSpawner) {
            this.spawnObjectRoutine(
              this.leftHand.object3D,
              superSpawner,
              "#player-left-controller",
              LEFT_HAND_CONSTRAINT_CREATION_ATTEMPT_EVENT
            );
          }
        }
      }
    }

    if (!this.rightRemoteConstraintTarget) {
      if (this.rightHandConstraintTarget) {
        const networked = this.rightHandConstraintTarget.components["networked"];
        const lostOwnership = networked && networked.data.owner !== NAF.clientId;
        if (rightHandDrop || lostOwnership) {
          this.rightHandConstraintTarget.removeAttribute("ammo-constraint");
          if (lostOwnership) {
            this.rightHandConstraintTarget.setAttribute("ammo-body", { type: "kinematic" });
          }

          this.rightHandConstraintTarget.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
          this.rightHandConstraintTarget.object3D.dispatchEvent(RIGHT_HAND_CONSTRAINT_REMOVAL_EVENT);
          this.rightHandConstraintTarget = null;
        }
      } else {
        this.rightHandCollisionTarget = findHandCollisionTargetForBody(this.rightHand.body);
        if (this.rightHandCollisionTarget) {
          if (rightHandGrab) {
            const offersCollisionConstraint = this.rightHandCollisionTarget.components[
              "offers-constraint-when-colliding"
            ];
            const superSpawner = this.rightHandCollisionTarget.components["super-spawner"];
            if (offersCollisionConstraint) {
              if (
                !this.rightHandCollisionTarget.components["networked"] ||
                NAF.utils.isMine(this.rightHandCollisionTarget) ||
                NAF.utils.takeOwnership(this.rightHandCollisionTarget)
              ) {
                this.rightHandConstraintTarget = this.rightHandCollisionTarget;
                this.rightHandConstraintTarget.setAttribute("ammo-body", { type: "dynamic" });
                this.rightHandConstraintTarget.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
                this.rightHandConstraintTarget.setAttribute("ammo-constraint", { target: "#player-right-controller" });
                this.rightHandConstraintTarget.object3D.dispatchEvent(RIGHT_HAND_CONSTRAINT_CREATION_ATTEMPT_EVENT);
              } else {
                //TODO: communicate a failure to obtain network ownership
              }
            } else if (superSpawner) {
              this.spawnObjectRoutine(
                this.rightHand.object3D,
                superSpawner,
                "#player-right-controller",
                RIGHT_HAND_CONSTRAINT_CREATION_ATTEMPT_EVENT
              );
            }
          }
        }
      }
    }

    const cursorWasEnabled = this.cursorController.components["cursor-controller"].enabled;
    const cursorShouldBeEnabled = !this.rightHandCollisionTarget && !this.rightHandTeleporter.isTeleporting;
    this.cursorController.components["cursor-controller"].enabled = cursorShouldBeEnabled;
    if (cursorWasEnabled && !cursorShouldBeEnabled && this.rightRemoteHoverTarget) {
      this.rightRemoteHoverTarget.object3D.dispatchEvent(UNHOVERED_EVENT);
      this.rightRemoteHoverTarget = null;
    }

    if (this.buttonHeldByRightRemote && rightRemoteDrop) {
      this.buttonHeldByRightRemote.el.object3D.dispatchEvent({
        type: "holdable-button-up",
        path: paths.actions.cursor.drop
      });
      this.buttonHeldByRightRemote = null;
    }

    if (this.rightRemoteConstraintTarget) {
      const networked = this.rightRemoteConstraintTarget.components["networked"];
      const lostOwnership = networked && networked.data.owner !== NAF.clientId;
      if (rightRemoteDrop || lostOwnership) {
        this.rightRemoteConstraintTarget.removeAttribute("ammo-constraint");
        if (lostOwnership) {
          this.rightRemoteConstraintTarget.setAttribute("ammo-body", { type: "kinematic" });
        }
        this.rightRemoteConstraintTarget.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
        this.rightRemoteConstraintTarget.object3D.dispatchEvent(RIGHT_REMOTE_CONSTRAINT_REMOVAL_EVENT);
        this.rightRemoteConstraintTarget = null;
      }
    } else {
      if (!this.rightHandCollisionTarget && this.rightRemoteHoverTarget && (rightRemoteGrab || this.weWantToGrab)) {
        this.weWantToGrab = false;
        const singleActionButton = this.rightRemoteHoverTarget.components["single-action-button"];
        if (singleActionButton) {
          singleActionButton.el.object3D.dispatchEvent({ type: "interact", path: paths.actions.cursor.grab });
        }

        const holdableButton = this.rightRemoteHoverTarget.components["holdable-button"];
        if (holdableButton) {
          this.buttonHeldByRightRemote = holdableButton;
          holdableButton.el.object3D.dispatchEvent({ type: "holdable-button-down", path: paths.actions.cursor.grab });
        }

        const offersRemoteConstraint = this.rightRemoteHoverTarget.components["offers-remote-constraint"];
        const superSpawner = this.rightRemoteHoverTarget.components["super-spawner"];
        if (offersRemoteConstraint) {
          if (
            !this.rightRemoteHoverTarget.components["networked"] ||
            NAF.utils.isMine(this.rightRemoteHoverTarget) ||
            NAF.utils.takeOwnership(this.rightRemoteHoverTarget)
          ) {
            this.rightRemoteConstraintTarget = this.rightRemoteHoverTarget;
            this.rightRemoteConstraintTarget.setAttribute("ammo-body", { type: "dynamic" });
            this.rightRemoteConstraintTarget.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
            this.rightRemoteConstraintTarget.setAttribute("ammo-constraint", { target: "#cursor" });
            this.rightRemoteConstraintTarget.object3D.dispatchEvent(RIGHT_REMOTE_CONSTRAINT_CREATION_ATTEMPT_EVENT);
          } else {
            //TODO: communicate a failure to obtain network ownership
          }
        } else if (superSpawner) {
          this.spawnObjectRoutine(
            this.cursor.object3D,
            superSpawner,
            "#cursor",
            RIGHT_REMOTE_CONSTRAINT_CREATION_ATTEMPT_EVENT
          );
        }
      }
    }
  }
});
