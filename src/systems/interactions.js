/* global AFRAME Ammo NAF MutationObserver require */
import { waitForEvent } from "../utils/async-utils";
import { paths } from "./userinput/paths";
import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

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
    this.rightRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object);
  },

  async spawnObjectRoutine(state, constants, superSpawner) {
    constants.entity.object3D.updateMatrices();
    constants.entity.object3D.matrix.decompose(
      constants.entity.object3D.position,
      constants.entity.object3D.quaternion,
      constants.entity.object3D.scale
    );
    const data = superSpawner.data;
    const entity = addMedia(data.src, data.template, ObjectContentOrigins.SPAWNER, data.resolve, data.resize).entity;
    entity.object3D.position.copy(data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position);
    entity.object3D.rotation.copy(data.useCustomSpawnRotation ? data.spawnRotation : superSpawner.el.object3D.rotation);
    entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    entity.object3D.matrixNeedsUpdate = true;
    state.held = entity;

    superSpawner.activateCooldown();
    // WARNING: waitForEvent is semantically different than entity.addEventListener("body-loaded", ...)
    // and adding a callback fn via addEventListener will not work unless the callback function
    // wraps its code in setTimeout(()=>{...}, 0)
    await waitForEvent("body-loaded", entity);
    entity.object3D.position.copy(data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position);
    if (data.centerSpawnedObject) {
      entity.body.position.copy(constants.entity.object3D.position);
    }
    entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    entity.object3D.matrixNeedsUpdate = true;

    // We don't bother trying to obtain ownership because we assume we have it
    state.held.setAttribute("ammo-body", { type: "dynamic" });
    state.held.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
    state.held.setAttribute("ammo-constraint", { target: "#" + constants.entity.id });
  },

  init: function() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.rightRemoteConstraintTarget = null;
    this.weWantToGrab = false;
    this.constants = {
      leftHand: {
        entity: document.querySelector("#player-left-controller"),
        grabPath: paths.actions.leftHand.grab,
        dropPath: paths.actions.leftHand.drop,
        constraintOfferingComponentName: "offers-constraint-when-colliding",
        hoverFn: findHandCollisionTargetForBody
      },
      rightHand: {
        entity: document.querySelector("#player-right-controller"),
        grabPath: paths.actions.rightHand.grab,
        dropPath: paths.actions.rightHand.drop,
        constraintOfferingComponentName: "offers-constraint-when-colliding",
        hoverFn: findHandCollisionTargetForBody
      },
      rightRemote: {
        entity: document.querySelector("#cursor"),
        grabPath: paths.actions.cursor.grab,
        dropPath: paths.actions.cursor.drop,
        constraintOfferingComponentName: "offers-remote-constraint",
        hoverFn: this.getRightRemoteHoverTarget
      }
    };
    this.state = {
      leftHand: {
        hovered: null,
        held: null
      },
      rightHand: {
        hovered: null,
        held: null
      },
      rightRemote: {
        hovered: null,
        held: null
      }
    };
  },

  getRightRemoteHoverTarget() {
    return this.rightRemoteHoverTarget;
  },

  tickInteractor(constants, state) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (state.held) {
      const networked = state.held.components["networked"];
      const lostOwnership = networked && networked.data.owner !== NAF.clientId;
      if (userinput.get(constants.dropPath) || lostOwnership) {
        state.held.removeAttribute("ammo-constraint");
        if (lostOwnership) {
          state.held.setAttribute("ammo-body", { type: "kinematic" });
        }
        state.held.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
        state.held = null;
      }
    } else {
      state.hovered = constants.hoverFn.call(this, constants.entity.body);
      if (state.hovered) {
        if (userinput.get(constants.grabPath)) {
          const offersCollisionConstraint = state.hovered.components[constants.constraintOfferingComponentName];
          const superSpawner = state.hovered.components["super-spawner"];
          if (offersCollisionConstraint) {
            if (
              !state.hovered.components["networked"] ||
              NAF.utils.isMine(state.hovered) ||
              NAF.utils.takeOwnership(state.hovered)
            ) {
              state.held = state.hovered;
              state.held.setAttribute("ammo-body", { type: "dynamic" });
              state.held.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
              state.held.setAttribute("ammo-constraint", { target: "#" + constants.entity.id });
            } else {
              //TODO: communicate a failure to obtain network ownership
            }
          } else if (superSpawner) {
            this.spawnObjectRoutine(state, constants, superSpawner);
          }
        }
      }
    }
  },

  tick: async function() {
    this.cursorTargettingSystem.tick();
    const userinput = AFRAME.scenes[0].systems.userinput;
    this.cursorController = this.cursorController || document.querySelector("#cursor-controller");
    this.rightHandTeleporter = this.constants.rightHand.entity.components["teleporter"];

    this.tickInteractor(this.constants.leftHand, this.state.leftHand);
    if (!this.state.rightRemote.held) {
      this.tickInteractor(this.constants.rightHand, this.state.rightHand);
    }

    const rightRemoteWasEnabled = this.cursorController.components["cursor-controller"].enabled;
    const rightRemoteShouldBeEnabled =
      !this.state.rightHand.hovered && !this.state.rightHand.held && !this.rightHandTeleporter.isTeleporting;
    this.cursorController.components["cursor-controller"].enabled = rightRemoteShouldBeEnabled;
    if (rightRemoteWasEnabled && !rightRemoteShouldBeEnabled) {
      this.state.rightRemote.hovered = null;
    }

    if (!this.state.rightHand.held && !this.state.rightHand.hovered) {
      this.tickInteractor(this.constants.rightRemote, this.state.rightRemote);
    }

    if (this.state.rightRemote.hovered && userinput.get(this.constants.rightRemote.grabPath)) {
      const singleActionButton = this.state.rightRemote.hovered.components["single-action-button"];
      if (singleActionButton) {
        singleActionButton.el.object3D.dispatchEvent({ type: "interact", path: this.constants.rightRemote.grabPath });
      }

      const holdableButton = this.state.rightRemote.hovered.components["holdable-button"];
      if (holdableButton) {
        this.state.rightRemote.held = holdableButton.el;
        holdableButton.el.object3D.dispatchEvent({
          type: "holdable-button-down",
          path: this.constants.rightRemote.grabPath
        });
      }
    }
  }
});
