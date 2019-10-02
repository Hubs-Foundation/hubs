/* global NAF AFRAME */
import { Constraint } from "three-ammo";
import { ACTIVATION_STATE } from "three-ammo/constants.js";

const CONSTRAINT_CONFIG = {};

export class ConstraintsSystem {
  constructor(physicsSystem) {
    this.prevLeftHand = {
      held: null,
      spawning: false
    };
    this.prevRightHand = {
      held: null,
      spawning: false
    };
    this.prevRightRemote = {
      held: null,
      spawning: false
    };
    this.prevLeftRemote = {
      held: null,
      spawning: false
    };

    this.physicsSystem = physicsSystem;
    this.constraints = {};
    this.constraintPairs = {};
  }

  tickInteractor(constraintTag, entityId, state, prevState) {
    if (!this.physicsSystem.world) return;

    if (prevState.held === state.held) {
      if (
        !state.spawning &&
        prevState.spawning &&
        state.held &&
        state.held.components.tags &&
        state.held.components.tags.data[constraintTag]
      ) {
        state.held.setAttribute("body-helper", {
          type: "dynamic",
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
        const heldEntityId = state.held.id;
        const body = state.held.components["body-helper"].body;
        const targetEl = document.querySelector(`#${entityId}`);
        const targetBody = targetEl.components["body-helper"].body;
        if (targetBody && targetBody.physicsBody) {
          this.constraints[entityId] = new Constraint({}, body, targetBody, this.physicsSystem.world);
          if (!this.constraintPairs[heldEntityId]) {
            this.constraintPairs[heldEntityId] = [];
          }
          this.constraintPairs[heldEntityId].push(entityId);
        }
      }
      return;
    }
    if (prevState.held && prevState.held.components.tags && prevState.held.components.tags.data[constraintTag]) {
      const heldEntityId = prevState.held.id;
      if (this.constraintPairs[heldEntityId] && this.constraintPairs[heldEntityId].indexOf(entityId) !== -1) {
        this.constraintPairs[heldEntityId].splice(this.constraintPairs[heldEntityId].indexOf(entityId), 1);
        if (this.constraintPairs[heldEntityId].length === 0) {
          delete this.constraintPairs[heldEntityId];
        }
        this.constraints[entityId].destroy();
        delete this.constraints[entityId];
      }

      if (!this.constraintPairs[heldEntityId] || this.constraintPairs[heldEntityId].length < 1) {
        prevState.held.setAttribute("body-helper", { activationState: ACTIVATION_STATE.ACTIVE_TAG });
      }
    }
    if (!state.spawning && state.held && state.held.components.tags.data[constraintTag]) {
      if (!state.held.components["networked"] || NAF.utils.isMine(state.held) || NAF.utils.takeOwnership(state.held)) {
        state.held.setAttribute("body-helper", {
          type: "dynamic",
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
        const heldEntityId = state.held.id;
        const body = state.held.components["body-helper"].body;
        const targetEl = document.querySelector(`#${entityId}`);
        const targetBody = targetEl.components["body-helper"].body;
        if (targetBody && targetBody.physicsBody) {
          this.constraints[entityId] = new Constraint(CONSTRAINT_CONFIG, body, targetBody, this.physicsSystem.world);
          if (!this.constraintPairs[heldEntityId]) {
            this.constraintPairs[heldEntityId] = [];
          }
          this.constraintPairs[heldEntityId].push(entityId);
        }
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
    this.tickInteractor(
      "offersRemoteConstraint",
      interaction.options.leftRemote.entity.id,
      interaction.state.leftRemote,
      this.prevLeftRemote
    );

    Object.assign(this.prevLeftHand, interaction.state.leftHand);
    Object.assign(this.prevRightHand, interaction.state.rightHand);
    Object.assign(this.prevRightRemote, interaction.state.rightRemote);
    Object.assign(this.prevLeftRemote, interaction.state.leftRemote);
  }

  // for held objects deleted during the component tick
  release(el) {
    if (this.prevLeftHand.held === el) {
      this.prevLeftHand.held = null;
      this.prevLeftHand.spawning = false;
    }
    if (this.prevLeftHand.held === el) {
      this.prevLeftHand.held = null;
      this.prevLeftHand.spawning = false;
    }
    if (this.prevRightRemote.held === el) {
      this.prevRightRemote.held = null;
      this.prevRightRemote.spawning = false;
    }
    if (this.prevLeftRemote.held === el) {
      this.prevLeftRemote.held = null;
      this.prevLeftRemote.spawning = false;
    }
  }
}
