/* global AFRAME NAF */
import { paths } from "./userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { canMove } from "../utils/permissions-utils";
import { isTagged } from "../components/tags";
import { Hoverable } from "../ecsy/components/Hoverable";
import { Holdable } from "../ecsy/components/Holdable";
import { InteractionState } from "../ecsy/components/InteractionState";

export function isHoverableByHand(entity) {
  if (!entity.isECSYEntity) {
    return false;
  }

  const hoverable = entity.getComponent(Hoverable);
  return hoverable && hoverable.hand;
}

export function isHoverableByRemote(entity) {
  if (!entity.isECSYEntity) {
    return false;
  }

  const hoverable = entity.getComponent(Hoverable);
  return hoverable && hoverable.remote;
}

function findHandCollisionTargetForHand(bodyHelper) {
  const physicsSystem = this.el.sceneEl.systems["hubs-systems"].physicsSystem;

  const handCollisions = physicsSystem.getCollisions(bodyHelper.uuid);
  if (handCollisions) {
    for (let i = 0; i < handCollisions.length; i++) {
      const bodyData = physicsSystem.bodyUuidToData.get(handCollisions[i]);
      const object3D = bodyData && bodyData.object3D;

      if (!object3D) {
        continue;
      }

      if (object3D.entity) {
        if (isHoverableByHand(object3D.entity)) {
          return object3D.entity;
        }
      } else if (object3D.el && isTagged(object3D.el, "isHandCollisionTarget")) {
        return object3D.el;
      }
    }
  }

  return null;
}

const notRemoteHoverTargets = new Map();
const remoteHoverTargets = new Map();
export function findRemoteHoverTarget(object3D) {
  if (!object3D) return null;
  if (object3D.entity && isHoverableByRemote(object3D.entity)) return object3D.entity;
  if (notRemoteHoverTargets.get(object3D)) return null;
  const target = remoteHoverTargets.get(object3D);
  return target || findRemoteHoverTarget(object3D.parent);
}

AFRAME.registerComponent("is-remote-hover-target", {
  init: function() {
    remoteHoverTargets.set(this.el.object3D, this.el);
  },
  remove: function() {
    remoteHoverTargets.delete(this.el.object3D);
  }
});
AFRAME.registerComponent("is-not-remote-hover-target", {
  init: function() {
    notRemoteHoverTargets.set(this.el.object3D, this.el);
  },
  remove: function() {
    notRemoteHoverTargets.delete(this.el.object3D);
  }
});

export function isUI(el) {
  return isTagged(el, "singleActionButton") || isTagged(el, "holdableButton");
}

AFRAME.registerSystem("interaction", {
  updateCursorIntersection: function(intersection, left) {
    const hoverTarget = intersection && findRemoteHoverTarget(intersection.object);

    if (!left) {
      this.rightRemoteHoverTarget = hoverTarget;
      return this.rightRemoteHoverTarget;
    }

    this.leftRemoteHoverTarget = hoverTarget;
    return this.leftRemoteHoverTarget;
  },

  getActiveIntersection() {
    return (
      (this.state.rightRemote.hovered && this.rightCursorControllerEl.components["cursor-controller"].intersection) ||
      (this.state.leftRemote.hovered && this.leftCursorControllerEl.components["cursor-controller"].intersection)
    );
  },

  isHoldingAnything() {
    return !!(
      this.state.leftHand.held ||
      this.state.rightHand.held ||
      this.state.rightRemote.held ||
      this.state.leftRemote.held
    );
  },

  isHeld(el) {
    return (
      this.state.leftHand.held === el ||
      this.state.rightHand.held === el ||
      this.state.rightRemote.held === el ||
      this.state.leftRemote.held === el
    );
  },

  release(el) {
    if (this.state.rightHand.held === el) {
      this.state.rightHand.held = null;
    }
    if (this.state.leftHand.hovered === el) {
      this.state.leftHand.hovered = null;
    }
    if (this.state.leftHand.held === el) {
      this.state.leftHand.held = null;
    }
    if (this.state.rightHand.hovered === el) {
      this.state.rightHand.hovered = null;
    }
    if (this.state.rightRemote.held === el) {
      this.state.rightRemote.held = null;
    }
    if (this.state.rightRemote.hovered === el) {
      this.state.rightRemote.hovered = null;
    }
    if (this.state.leftRemote.held === el) {
      this.state.leftRemote.held = null;
    }
    if (this.state.leftRemote.hovered === el) {
      this.state.leftRemote.hovered = null;
    }
  },

  getRightRemoteHoverTarget() {
    return this.rightRemoteHoverTarget;
  },

  getLeftRemoteHoverTarget() {
    return this.leftRemoteHoverTarget;
  },

  init: function() {
    this.options = {
      leftHand: {
        entity: null,
        grabPath: paths.actions.leftHand.grab,
        dropPath: paths.actions.leftHand.drop,
        hoverFn: findHandCollisionTargetForHand
      },
      rightHand: {
        entity: null,
        grabPath: paths.actions.rightHand.grab,
        dropPath: paths.actions.rightHand.drop,
        hoverFn: findHandCollisionTargetForHand
      },
      rightRemote: {
        entity: null,
        grabPath: paths.actions.cursor.right.grab,
        dropPath: paths.actions.cursor.right.drop,
        hoverFn: this.getRightRemoteHoverTarget
      },
      leftRemote: {
        entity: null,
        grabPath: paths.actions.cursor.left.grab,
        dropPath: paths.actions.cursor.left.drop,
        hoverFn: this.getLeftRemoteHoverTarget
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
      },
      leftRemote: {
        hovered: null,
        held: null,
        spawning: null
      }
    };
    this.previousState = {
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
      },
      leftRemote: {
        hovered: null,
        held: null,
        spawning: null
      }
    };
    waitForDOMContentLoaded().then(() => {
      this.options.leftHand.entity = document.getElementById("player-left-controller");
      this.options.rightHand.entity = document.getElementById("player-right-controller");
      this.options.rightRemote.entity = document.getElementById("right-cursor");
      this.options.leftRemote.entity = document.getElementById("left-cursor");
      this.rightCursorControllerEl = document.getElementById("right-cursor-controller");
      this.leftCursorControllerEl = document.getElementById("left-cursor-controller");
      this.ready = true;
    });
  },

  tickInteractor(options, state) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (state.held) {
      let lostOwnership = false;

      // TODO: Support networked ownership transfer for ECSY entities
      if (!state.held.isECSYEntity) {
        const networked = state.held.components["networked"];
        lostOwnership = networked && networked.data && networked.data.owner !== NAF.clientId;
      }

      if (userinput.get(options.dropPath) || lostOwnership) {
        state.held = null;
      }
    } else {
      state.hovered = options.hoverFn.call(
        this,
        options.entity.components["body-helper"] && options.entity.components["body-helper"]
          ? options.entity.components["body-helper"]
          : null
      );
      if (state.hovered) {
        const entity = state.hovered;
        if (entity.isECSYEntity) {
          if (entity.getComponent(Holdable) && userinput.get(options.grabPath)) {
            console.log("hold", entity);
            state.held = entity;
          }
        } else {
          const isFrozen = this.el.is("frozen");
          const isPinned = entity.components.pinnable && entity.components.pinnable.data.pinned;

          if (
            isTagged(entity, "isHoldable") &&
            userinput.get(options.grabPath) &&
            (isFrozen || !isPinned) &&
            canMove(entity)
          ) {
            state.held = entity;
          }
        }
      }
    }
  },

  tick2() {
    if (this.el.is("entered")) {
      Object.assign(this.previousState.rightHand, this.state.rightHand);
      Object.assign(this.previousState.rightRemote, this.state.rightRemote);
      Object.assign(this.previousState.leftHand, this.state.leftHand);
      Object.assign(this.previousState.leftRemote, this.state.leftRemote);

      if (this.options.leftHand.entity.object3D.visible && !this.state.leftRemote.held) {
        this.tickInteractor(this.options.leftHand, this.state.leftHand);
      }
      if (this.options.rightHand.entity.object3D.visible && !this.state.rightRemote.held) {
        this.tickInteractor(this.options.rightHand, this.state.rightHand);
      }
      if (!this.state.rightHand.held && !this.state.rightHand.hovered) {
        this.tickInteractor(this.options.rightRemote, this.state.rightRemote);
      }
      if (!this.state.leftHand.held && !this.state.leftHand.hovered) {
        this.tickInteractor(this.options.leftRemote, this.state.leftRemote);
      }
    }

    const worldManager = AFRAME.scenes[0].systems["hubs-systems"].worldManager;

    if (worldManager.scene) {
      const interactionState = worldManager.scene.getMutableComponent(InteractionState);
      interactionState.copy(this.state);
    }
  }
});
