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


AFRAME.registerSystem("interaction", {
  updateCursorIntersection: function(intersection) {
    this.rightRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object);
  },

  async spawnObjectRoutine(state, options, superSpawner) {
    options.entity.object3D.updateMatrices();
    options.entity.object3D.matrix.decompose(
      options.entity.object3D.position,
      options.entity.object3D.quaternion,
      options.entity.object3D.scale
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
      entity.body.position.copy(options.entity.object3D.position);
    }
    entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    entity.object3D.matrixNeedsUpdate = true;

    // We don't bother trying to obtain ownership because we assume we have it
    state.held.setAttribute("ammo-body", { type: "dynamic" });
    state.held.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
    state.held.setAttribute("ammo-constraint", { target: "#" + options.entity.id });
  },

  init: function() {
    this.rightRemoteConstraintTarget = null;
    this.weWantToGrab = false;
    this.options = {
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

  tickInteractor(options, state) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (state.held) {
      const networked = state.held.components["networked"];
      const lostOwnership = networked && networked.data.owner !== NAF.clientId;
      if (userinput.get(options.dropPath) || lostOwnership) {
        state.held.removeAttribute("ammo-constraint");
        if (lostOwnership) {
          state.held.setAttribute("ammo-body", { type: "kinematic" });
        }
        state.held.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
        state.held = null;
      }
    } else {
      state.hovered = options.hoverFn.call(this, options.entity.body);
      if (state.hovered) {
        if (userinput.get(options.grabPath)) {
          const offersCollisionConstraint = state.hovered.components[options.constraintOfferingComponentName];
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
              state.held.setAttribute("ammo-constraint", { target: "#" + options.entity.id });
            } else {
              //TODO: communicate a failure to obtain network ownership
            }
          } else if (superSpawner) {
            this.spawnObjectRoutine(state, options, superSpawner);
          }
        }
      }
    }
  },

  tick2: async function() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    this.cursorController = this.cursorController || document.querySelector("#cursor-controller");
    this.rightHandTeleporter = this.options.rightHand.entity.components["teleporter"];

    this.tickInteractor(this.options.leftHand, this.state.leftHand);
    if (!this.state.rightRemote.held) {
      this.tickInteractor(this.options.rightHand, this.state.rightHand);
    }

    const rightRemoteWasEnabled = this.cursorController.components["cursor-controller"].enabled;
    const rightRemoteShouldBeEnabled =
      !this.state.rightHand.hovered && !this.state.rightHand.held && !this.rightHandTeleporter.isTeleporting;
    this.cursorController.components["cursor-controller"].enabled = rightRemoteShouldBeEnabled;
    if (rightRemoteWasEnabled && !rightRemoteShouldBeEnabled) {
      this.state.rightRemote.hovered = null;
    }

    if (!this.state.rightHand.held && !this.state.rightHand.hovered) {
      this.tickInteractor(this.options.rightRemote, this.state.rightRemote);
    }

    if (this.state.rightRemote.hovered && userinput.get(this.options.rightRemote.grabPath)) {
      const singleActionButton = this.state.rightRemote.hovered.components["single-action-button"];
      if (singleActionButton) {
        singleActionButton.el.object3D.dispatchEvent({ type: "interact", path: this.options.rightRemote.grabPath });
      }

      const holdableButton = this.state.rightRemote.hovered.components["holdable-button"];
      if (holdableButton) {
        this.state.rightRemote.held = holdableButton.el;
        holdableButton.el.object3D.dispatchEvent({
          type: "holdable-button-down",
          path: this.options.rightRemote.grabPath
        });
      }
    }
  }
});
