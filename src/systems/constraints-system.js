/* global NAF AFRAME */
const ACTIVATION_STATE = require("aframe-physics-system/src/constants").ACTIVATION_STATE;

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
      if (!state.spawning && prevState.spawning && state.held && state.held.components.tags.data[constraintTag]) {
        state.held.setAttribute("ammo-body", {
          type: "dynamic",
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
        state.held.setAttribute("ammo-constraint__" + entityId, { target: "#" + entityId });
      }
      return;
    }
    if (prevState.held && prevState.held.components.tags.data[constraintTag]) {
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
    if (!state.spawning && state.held && state.held.components.tags.data[constraintTag]) {
      if (!state.held.components["networked"] || NAF.utils.isMine(state.held) || NAF.utils.takeOwnership(state.held)) {
        state.held.setAttribute("ammo-body", {
          type: "dynamic",
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
        state.held.setAttribute("ammo-constraint__" + entityId, { target: "#" + entityId });
      } else {
        console.log("Failed to obtain ownership while trying to create constraint on networked object.");
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

    Object.assign(this.prevLeftHand, interaction.state.leftHand);
    Object.assign(this.prevRightHand, interaction.state.rightHand);
    Object.assign(this.prevRightRemote, interaction.state.rightRemote);
  }
}
