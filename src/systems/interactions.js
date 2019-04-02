/* global AFRAME Ammo NAF */
import { paths } from "./userinput/paths";

const handCollisionTargets = new Map();
AFRAME.registerComponent("is-hand-collision-target", {
  init: function() {
    handCollisionTargets.set(this.el.object3D.uuid, this.el);
  },
  remove: function() {
    handCollisionTargets.delete(this.el.object3D.uuid);
  }
});
function findHandCollisionTarget(o) {
  if (!o) return null;
  const target = handCollisionTargets.get(o.uuid);
  return target || findHandCollisionTarget(o.parent);
}
function findHandCollisionTargetForHand(body) {
  const driver = AFRAME.scenes[0].systems.physics.driver;
  const numManifolds = driver.dispatcher.getNumManifolds();
  const handPtr = Ammo.getPointer(body);
  for (let i = 0; i < numManifolds; i++) {
    const persistentManifold = driver.dispatcher.getManifoldByIndexInternal(i);
    const body0ptr = Ammo.getPointer(persistentManifold.getBody0());
    const body1ptr = Ammo.getPointer(persistentManifold.getBody1());
    if (handPtr !== body0ptr && handPtr !== body1ptr) {
      continue;
    }
    const numContacts = persistentManifold.getNumContacts();
    for (let j = 0; j < numContacts; j++) {
      const manifoldPoint = persistentManifold.getContactPoint(j);
      if (manifoldPoint.getDistance() <= 10e-6) {
        return findHandCollisionTarget(driver.els.get(handPtr === body0ptr ? body1ptr : body0ptr).object3D);
      }
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
  },
  remove: function() {
    remoteHoverTargets.delete(this.el.object3D.uuid);
  }
});

AFRAME.registerSystem("interaction", {
  updateCursorIntersection: function(intersection) {
    this.rightRemoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object);
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
      if (
        state.hovered &&
        state.hovered.components.tags &&
        state.hovered.components.tags.data.isHoldable &&
        userinput.get(options.grabPath) &&
        (this.el.is("frozen") || !state.hovered.components.pinnable || !state.hovered.components.pinnable.data.pinned)
      ) {
        state.held = state.hovered;
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
