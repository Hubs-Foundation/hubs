/* global AFRAME Ammo NAF */
import { waitForEvent } from "../utils/async-utils";
import { paths } from "./userinput/paths";
import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

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
function findHandCollisionTargetForHand(body) {
  const driver = AFRAME.scenes[0].systems.physics.driver;
  const collisions = driver.collisions;
  const handPtr = Ammo.getPointer(body);
  for (const key in collisions) {
    const [body0ptr, body1ptr] = collisions[key];
    if (body0ptr === handPtr) {
      return findHandCollisionTarget(driver.els[body1ptr].object3D);
    }
    if (body1ptr === handPtr) {
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
    state.spawning = true;
    await waitForEvent("body-loaded", entity);
    state.spawning = false;
    entity.object3D.position.copy(data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position);
    if (data.centerSpawnedObject) {
      entity.body.position.copy(options.entity.object3D.position);
    }
    entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    entity.object3D.matrixNeedsUpdate = true;
  },

  init: function() {
    this.options = {
      leftHand: {
        entity: document.querySelector("#player-left-controller"),
        grabPath: paths.actions.leftHand.grab,
        dropPath: paths.actions.leftHand.drop,
        constraintTag: "offersHandConstraint",
        hoverFn: findHandCollisionTargetForHand
      },
      rightHand: {
        entity: document.querySelector("#player-right-controller"),
        grabPath: paths.actions.rightHand.grab,
        dropPath: paths.actions.rightHand.drop,
        constraintTag: "offersHandConstraint",
        hoverFn: findHandCollisionTargetForHand
      },
      rightRemote: {
        entity: document.querySelector("#cursor"),
        grabPath: paths.actions.cursor.grab,
        dropPath: paths.actions.cursor.drop,
        constraintTag: "offersRemoteConstraint",
        hoverFn: this.getRightRemoteHoverTarget
      }
    };
    this.state = {
      leftHand: {
        hovered: null,
        held: null,
        spawning: null
      },
      rightHand: {
        hovered: null,
        held: null,
        spawning: null
      },
      rightRemote: {
        hovered: null,
        held: null,
        spawning: null
      }
    };

    this.cursorController = document.querySelector("#cursor-controller");
  },

  getRightRemoteHoverTarget() {
    return this.rightRemoteHoverTarget;
  },

  tickInteractor(options, state) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (state.held) {
      const networked = state.held.components["networked"];
      const lostOwnership = networked && networked.data && networked.data.owner !== NAF.clientId;
      if (userinput.get(options.dropPath) || lostOwnership) {
        state.held = null;
      }
    } else {
      state.hovered = options.hoverFn.call(this, options.entity.body);
      if (state.hovered) {
        if (userinput.get(options.grabPath)) {
          const offersConstraint =
            state.hovered.components.tags && state.hovered.components.tags.data[options.constraintTag];
          const isHoldableButton = state.hovered.components.tags && state.hovered.components.tags.data.holdableButton;
          const superSpawner = state.hovered.components["super-spawner"];
          if (offersConstraint || isHoldableButton) {
            if (
              this.el.is("frozen") ||
              !state.hovered.components.pinnable ||
              !state.hovered.components.pinnable.data.pinned
            ) {
              state.held = state.hovered;
            }
          } else if (superSpawner) {
            this.spawnObjectRoutine(state, options, superSpawner);
          }
        }
      }
    }
  },

  tick2() {
    if (!this.el.is("entered")) return;
    this.rightHandTeleporter =
      this.rightHandTeleporter || document.querySelector("#player-right-controller").components["teleporter"];

    this.tickInteractor(this.options.leftHand, this.state.leftHand);
    if (!this.state.rightRemote.held) {
      this.tickInteractor(this.options.rightHand, this.state.rightHand);
    }

    if (!this.state.rightHand.held && !this.state.rightHand.hovered) {
      this.tickInteractor(this.options.rightRemote, this.state.rightRemote);
    }

    const enableRightRemote =
      !this.state.rightHand.hovered && !this.state.rightHand.held && !this.rightHandTeleporter.isTeleporting;
    this.cursorController.components["cursor-controller"].enabled = enableRightRemote;
    if (!enableRightRemote) {
      this.state.rightRemote.hovered = null;
    }

    if (this.el.systems.userinput.get(paths.actions.logInteractionState)) {
      console.log(
        "Interaction System State\nleftHand held",
        this.state.leftHand.held,
        "\nleftHand hovered",
        this.state.leftHand.hovered,
        "\nrightHand held",
        this.state.rightHand.held,
        "\nrightHand hovered",
        this.state.rightHand.hovered,
        "\nrightRemote held",
        this.state.rightRemote.held,
        "\nrightRemote hovered",
        this.state.rightRemote.hovered
      );
    }
  }
});
