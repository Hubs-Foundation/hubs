/* global NAF AFRAME */
import { CONSTANTS } from "three-ammo";
import { isTagged } from "../components/tags";
import { Rigidbody } from "../utils/jsx-entity";
const ACTIVATION_STATE = CONSTANTS.ACTIVATION_STATE;

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
    this.constraintPairs = {};
  }

  tickInteractor(constraintTag, interactorEid, state, prevState) {
    if (!this.physicsSystem) return;

    // TODO what is spawning?

    if (prevState.held === state.held) {
      if (!state.spawning && prevState.spawning && state.held && isTagged(state.held, constraintTag)) {
        const eid = state.held.object3D.eid;
        const bodyId = Rigidbody.bodyId[eid];

        const bodyOptions = this.physicsSystem.bodyUuidToData.get(bodyId).options;
        bodyOptions.type = "dynamic";
        bodyOptions.activationState = ACTIVATION_STATE.DISABLE_DEACTIVATION;
        this.physicsSystem.updateBody(bodyId, bodyOptions);

        const interactorBodyId = Rigidbody.bodyId[interactorEid];
        if (bodyId !== -1 && interactorBodyId !== -1) {
          this.physicsSystem.addConstraint(interactorEid, bodyId, interactorBodyId, {});
          if (!this.constraintPairs[eid]) {
            this.constraintPairs[eid] = [];
          }
          this.constraintPairs[eid].push(interactorEid);
        }
      }
      return;
    }

    if (prevState.held && isTagged(prevState.held, constraintTag)) {
      // console.log("remove constraint from", prevState.held);
      const eid = prevState.held.eid;
      const bodyId = Rigidbody.bodyId[eid];

      // TODO do we need this constraintPairs logic?
      if (this.constraintPairs[eid] && this.constraintPairs[eid].indexOf(interactorEid) !== -1) {
        this.constraintPairs[eid].splice(this.constraintPairs[eid].indexOf(interactorEid), 1);
        if (this.constraintPairs[eid].length === 0) {
          delete this.constraintPairs[eid];
        }
        this.physicsSystem.removeConstraint(interactorEid);
      }
      if (!this.constraintPairs[eid] || this.constraintPairs[eid].length < 1) {
        const bodyOptions = this.physicsSystem.bodyUuidToData.get(bodyId).options;
        // bodyOptions.type = "kinematic";
        bodyOptions.activationState = ACTIVATION_STATE.ACTIVE_TAG;
        this.physicsSystem.updateBody(bodyId, bodyOptions);
      }
    }

    if (!state.spawning && state.held && isTagged(state.held, constraintTag)) {
      if (!state.held.components["networked"] || NAF.utils.isMine(state.held) || NAF.utils.takeOwnership(state.held)) {
        const eid = state.held.eid;

        const interactorBodyId = Rigidbody.bodyId[interactorEid];
        const bodyId = Rigidbody.bodyId[eid];

        const bodyOptions = this.physicsSystem.bodyUuidToData.get(bodyId).options;
        bodyOptions.type = "dynamic";
        bodyOptions.activationState = ACTIVATION_STATE.DISABLE_DEACTIVATION;
        this.physicsSystem.updateBody(bodyId, bodyOptions);

        // console.log("add constraint to", interactorEid, bodyId, interactorBodyId);
        this.physicsSystem.addConstraint(interactorEid, bodyId, interactorBodyId, {});
        // TODO do we need this constraintPairs logic?
        if (!this.constraintPairs[eid]) {
          this.constraintPairs[eid] = [];
        }
        this.constraintPairs[eid].push(interactorEid);
      } else {
        console.log("Failed to obtain ownership while trying to create constraint on networked object.");
      }
    }
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (!interaction.ready) return; //DOMContentReady workaround

    this.tickInteractor(
      "offersHandConstraint",
      interaction.options.leftHand.entity.object3D.eid,
      interaction.state.leftHand,
      this.prevLeftHand
    );
    this.tickInteractor(
      "offersHandConstraint",
      interaction.options.rightHand.entity.object3D.eid,
      interaction.state.rightHand,
      this.prevRightHand
    );
    this.tickInteractor(
      "offersRemoteConstraint",
      interaction.options.rightRemote.entity.object3D.eid,
      interaction.state.rightRemote,
      this.prevRightRemote
    );
    this.tickInteractor(
      "offersRemoteConstraint",
      interaction.options.leftRemote.entity.object3D.eid,
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
