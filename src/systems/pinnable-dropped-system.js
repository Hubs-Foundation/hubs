export class PinnableDroppedSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const heldLeft = interaction.state.leftHand.held;
    const heldRight = interaction.state.rightHand.held;
    const heldRightRemote = interaction.state.rightRemote.held;

    if (
      this.prevHeldLeft &&
      this.prevHeldLeft.components.pinnable &&
      this.prevHeldLeft !== heldLeft &&
      this.prevHeldLeft !== heldRight &&
      this.prevHeldLeft !== heldRightRemote
    ) {
      this.prevHeldLeft.components.pinnable._fireEvents(this.prevHeldLeft.components.pinnable.data);
    }

    if (
      this.prevHeldRight &&
      this.prevHeldRight.components.pinnable &&
      this.prevHeldRight !== heldLeft &&
      this.prevHeldRight !== heldRight &&
      this.prevHeldRight !== heldRightRemote
    ) {
      this.prevHeldRight.components.pinnable._fireEvents(this.prevHeldRight.components.pinnable.data);
    }

    if (
      this.prevHeldRightRemote &&
      this.prevHeldRightRemote.components.pinnable &&
      this.prevHeldRightRemote !== heldLeft &&
      this.prevHeldRightRemote !== heldRight &&
      this.prevHeldRightRemote !== heldRightRemote
    ) {
      this.prevHeldRightRemote.components.pinnable._fireEvents(this.prevHeldRightRemote.components.pinnable.data);
    }

    this.prevHeldLeft = heldLeft;
    this.prevHeldRight = heldRight;
    this.prevHeldRightRemote = heldRightRemote;
  }
}
