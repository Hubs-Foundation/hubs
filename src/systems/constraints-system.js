const ACTIVATION_STATE = require("aframe-physics-system/src/constants").ACTIVATION_STATE;

function storeState(prev, curr) {
  prev.held = curr.held;
  prev.hovered = curr.hovered;
  prev.spawning = curr.spawning;
}

export class ConstraintsSystem {
  constructor() {
    this.prevLeftHand = {
      held: null,
      hovered: null,
      spawning: null
    };
    this.prevRightHand = {
      held: null,
      hovered: null,
      spawning: null
    };
    this.prevRightRemote = {
      held: null,
      hovered: null,
      spawning: null
    };
  }

  tickInteractor(constraintTag, entityId, state, prevState) {
    if (prevState.held === state.held) {
      if (
        state.held &&
        state.held.components.tags &&
        state.held.components.tags.data[constraintTag] &&
        prevState.spawning &&
        !state.spawning
      ) {
        state.held.setAttribute("ammo-body", {
          type: "dynamic",
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
        state.held.setAttribute("ammo-constraint__" + entityId, { target: "#" + entityId });
      }
      return;
    }
    if (prevState.held && prevState.held.components.tags && prevState.held.components.tags.data[constraintTag]) {
      prevState.held.removeAttribute("ammo-constraint__" + entityId);
      let hasAnotherConstraint = false;
      for (const componentName in prevState.held.components) {
        if (componentName.startsWith("ammo-constraint")) {
          hasAnotherConstraint = true;
        }
      }
      if (!hasAnotherConstraint) {
        prevState.held.setAttribute("ammo-body", { activationState: ACTIVATION_STATE.ACTIVE_TAG });
      }
    }
    if (state.held && state.held.components.tags && state.held.components.tags.data[constraintTag] && !state.spawning) {
      if (!state.held.components["networked"] || NAF.utils.isMine(state.held) || NAF.utils.takeOwnership(state.held)) {
        state.held.setAttribute("ammo-body", {
          type: "dynamic",
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
        state.held.setAttribute("ammo-constraint__" + entityId, { target: "#" + entityId });
      } else {
        // TODO communicate failure to obtain network ownership
      }
    }
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;

    this.tickInteractor(
      "offersHandConstraint",
      interaction.options.leftHand.entity.id,
      interaction.state.leftHand,
      this.prevLeftHand
    );
    this.tickInteractor(
      "offersHandConstraint",
      interaction.options.rightHand.entity.id,
      interaction.state.rightHand,
      this.prevRightHand
    );
    this.tickInteractor(
      "offersRemoteConstraint",
      interaction.options.rightRemote.entity.id,
      interaction.state.rightRemote,
      this.prevRightRemote
    );

    storeState(this.prevLeftHand, interaction.state.leftHand);
    storeState(this.prevRightHand, interaction.state.rightHand);
    storeState(this.prevRightRemote, interaction.state.rightRemote);
  }
}
