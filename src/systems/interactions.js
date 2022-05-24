/* global AFRAME NAF */
import { paths } from "./userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { canMove } from "../utils/permissions-utils";
import { isTagged } from "../components/tags";
import { addComponent, hasComponent, removeComponent } from "bitecs";
import { anyEntityWith } from "../utils/bit-utils";

import {
  Held,
  Holdable,
  Pinned,
  RemoteHoverTarget,
  Rigidbody,
  HoveredRemoteRight,
  HoveredRemoteLeft,
  HoveredHandRight,
  HoveredHandLeft,
  HeldRemoteRight,
  HeldRemoteLeft,
  HeldHandRight,
  HeldHandLeft,
  NotRemoteHoverTarget,
  AEntity
} from "../bit-components";

function anyAframeEntityWith(world, component) {
  const eid = anyEntityWith(world, component);
  return eid && hasComponent(world, AEntity, eid) && world.eid2obj.get(eid).el;
}

function findHandCollisionTargetForHand(bodyId) {
  const physicsSystem = this.el.sceneEl.systems["hubs-systems"].physicsSystem;

  const handCollisions = physicsSystem.getCollisions(bodyId);
  if (handCollisions) {
    for (let i = 0; i < handCollisions.length; i++) {
      const bodyData = physicsSystem.bodyUuidToData.get(handCollisions[i]);
      const object3D = bodyData && bodyData.object3D;
      if (object3D && isTagged(object3D.el, "isHandCollisionTarget")) {
        return object3D.el;
      }
    }
  }

  return null;
}

const notRemoteHoverTargets = new Map();
export function findRemoteHoverTarget(object3D) {
  if (!object3D) return null;
  if (notRemoteHoverTargets.get(object3D)) return null;

  if (object3D.eid !== undefined && hasComponent(APP.world, RemoteHoverTarget, object3D.eid)) {
    return object3D.el;
  }

  return findRemoteHoverTarget(object3D.parent);
}
AFRAME.registerComponent("is-remote-hover-target", {
  init: function() {
    addComponent(APP.world, RemoteHoverTarget, this.el.object3D.eid);
  },
  remove: function() {
    removeComponent(APP.world, RemoteHoverTarget, this.el.object3D.eid);
  }
});
AFRAME.registerComponent("is-not-remote-hover-target", {
  init: function() {
    notRemoteHoverTargets.set(this.el.object3D, this.el);
    addComponent(APP.world, NotRemoteHoverTarget, this.el.object3D.eid);
  },
  remove: function() {
    notRemoteHoverTargets.delete(this.el.object3D);
    removeComponent(APP.world, NotRemoteHoverTarget, this.el.object3D.eid);
  }
});

export function isUI(el) {
  return isTagged(el, "singleActionButton") || isTagged(el, "holdableButton");
}

function identityFn(o) {
  return o;
}

AFRAME.registerSystem("interaction", {
  updateCursorIntersection: function(intersection, left) {
    if (!left) {
      this.rightRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object);
      return this.rightRemoteHoverTarget;
    }

    this.leftRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object);
    return this.leftRemoteHoverTarget;
  },

  getActiveIntersection() {
    return (
      (this.state.rightRemote.hovered && this.rightCursorControllerEl.components["cursor-controller"].intersection) ||
      (this.state.leftRemote.hovered && this.leftCursorControllerEl.components["cursor-controller"].intersection)
    );
  },

  isHoldingAnything(pred = identityFn) {
    return !!(
      pred(this.state.leftHand.held) ||
      pred(this.state.rightHand.held) ||
      pred(this.state.rightRemote.held) ||
      pred(this.state.leftRemote.held)
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

  wasReleasedThisFrame(el) {
    return (
      (this.previousState.leftHand.held === el && !this.state.leftHand.held) ||
      (this.previousState.rightHand.held === el && !this.state.rightHand.held) ||
      (this.previousState.rightRemote.held === el && !this.state.rightRemote.held) ||
      (this.previousState.leftRemote.held === el && !this.state.leftRemote.held)
    );
  },

  release(el) {
    if (this.state.leftHand.held === el) {
      this.state.leftHand.held = null;
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

  tickInteractor(options, state, hoveredComponent, heldComponent) {
    const userinput = AFRAME.scenes[0].systems.userinput;

    if (state.held) {
      const networked = state.held.components["networked"];
      const lostOwnership = networked && networked.data && networked.data.owner !== NAF.clientId;
      if (userinput.get(options.dropPath) || lostOwnership) {
        //TODO: Does everything break if someone deletes the thing you're holding?
        removeComponent(APP.world, heldComponent, state.held.object3D.eid);

        if (
          !hasComponent(APP.world, HeldRemoteRight, state.held.object3D.eid) &&
          !hasComponent(APP.world, HeldRemoteLeft, state.held.object3D.eid) &&
          !hasComponent(APP.world, HeldHandRight, state.held.object3D.eid) &&
          !hasComponent(APP.world, HeldHandLeft, state.held.object3D.eid)
        ) {
          removeComponent(APP.world, Held, state.held.object3D.eid);
        }

        state.held = null;
      }
    } else {
      const interactorEid = options.entity.object3D.eid;
      const newHovered = options.hoverFn.call(
        this,
        hasComponent(APP.world, Rigidbody, interactorEid) && Rigidbody.bodyId[interactorEid]
      );

      if (state.hovered && state.hovered !== newHovered) {
        // HACK we have to check if the hovered object still has an eid in case it's been removed from the scene graph
        state.hovered.object3D.eid && removeComponent(APP.world, hoveredComponent, state.hovered.object3D.eid);
      }

      state.hovered = newHovered;

      if (state.hovered) {
        addComponent(APP.world, hoveredComponent, state.hovered.object3D.eid);

        const entity = state.hovered;
        const hoveredEid = entity.object3D.eid;
        const sceneIsFrozen = this.el.is("frozen");
        const isPinned = hasComponent(APP.world, Pinned, hoveredEid);
        if (
          hasComponent(APP.world, Holdable, hoveredEid) &&
          userinput.get(options.grabPath) &&
          (sceneIsFrozen || !isPinned) &&
          canMove(entity)
        ) {
          state.held = entity;
          addComponent(APP.world, heldComponent, hoveredEid);
          addComponent(APP.world, Held, hoveredEid);
        }
      }
    }
  },

  tick2() {
    this.previousState.rightRemote.hovered = this.state.rightRemote.hovered;
    this.previousState.rightRemote.held = this.state.rightRemote.held;
    this.previousState.leftRemote.hovered = this.state.leftRemote.hovered;
    this.previousState.leftRemote.held = this.state.leftRemote.held;
    this.previousState.leftHand.hovered = this.state.leftHand.hovered;
    this.previousState.leftHand.held = this.state.leftHand.held;
    this.previousState.rightHand.hovered = this.state.rightHand.hovered;
    this.previousState.rightHand.held = this.state.rightHand.held;

    const world = APP.world;
    this.state.rightRemote.hovered = anyAframeEntityWith(world, HoveredRemoteRight);
    this.state.leftRemote.hovered = anyAframeEntityWith(world, HoveredRemoteLeft);
    this.state.rightHand.hovered = anyAframeEntityWith(world, HoveredHandRight);
    this.state.leftHand.hovered = anyAframeEntityWith(world, HoveredHandLeft);
    this.state.rightRemote.held = anyAframeEntityWith(world, HeldRemoteRight);
    this.state.leftRemote.held = anyAframeEntityWith(world, HeldRemoteLeft);
    this.state.rightHand.held = anyAframeEntityWith(world, HeldHandRight);
    this.state.leftHand.held = anyAframeEntityWith(world, HeldHandLeft);
  }
});
