const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

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

  tickInteractor(options, state, prevState) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (prevState.held === state.held) {
      if (prevState.spawning && !state.spawning) {
        state.held.setAttribute("ammo-body", { type: "dynamic" });
        state.held.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
        state.held.setAttribute("ammo-constraint__" + options.entity.id, { target: "#" + options.entity.id });
      }
      return;
    }
    if (prevState.held && prevState.held.components[options.constraintOfferingComponentName]) {
      const networked = prevState.held.components["networked"];
      const lostOwnership = networked && networked.data.owner !== NAF.clientId;
      prevState.held.removeAttribute("ammo-constraint__" + options.entity.id);
      if (lostOwnership) {
        prevState.held.setAttribute("ammo-body", { type: "kinematic" });
      }
      let hasConstraint = false;
      for (const componentName in prevState.held.components) {
        if (componentName.startsWith("ammo-constraint")) {
          hasConstraint = true;
        }
      }
      if (!hasConstraint) {
        prevState.held.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
      }
    }
    if (state.held && !state.spawning) {
      if (!state.held.components["networked"] || NAF.utils.isMine(state.held) || NAF.utils.takeOwnership(state.held)) {
        state.held.setAttribute("ammo-body", { type: "dynamic" });
        state.held.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
        state.held.setAttribute("ammo-constraint__" + options.entity.id, { target: "#" + options.entity.id });
      } else {
        // TODO communicate failure to obtain network ownership
        state.held = null;
      }
    }
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;

    this.tickInteractor(interaction.options.leftHand, interaction.state.leftHand, this.prevLeftHand);
    this.tickInteractor(interaction.options.rightHand, interaction.state.rightHand, this.prevRightHand);
    this.tickInteractor(interaction.options.rightRemote, interaction.state.rightRemote, this.prevRightRemote);

    storeState(this.prevLeftHand, interaction.state.leftHand);
    storeState(this.prevRightHand, interaction.state.rightHand);
    storeState(this.prevRightRemote, interaction.state.rightRemote);
  }
}
