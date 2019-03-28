export class SingleActionButtonSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const state = interaction.state.rightRemote;
    const path = interaction.options.rightRemote.grabPath;
    if (
      state.hovered &&
      userinput.get(path) &&
      state.hovered.components.tags &&
      state.hovered.components.tags.data.singleActionButton
    ) {
      state.hovered.object3D.dispatchEvent({
        type: "interact",
        path: path
      });
    }
  }
}

export class HoldableButtonSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const held = interaction.state.rightRemote.held;
    const options = interaction.options.rightRemote;

    if (this.prevHeld && this.prevHeld !== held) {
      this.prevHeld.object3D.dispatchEvent({
        type: "holdable-button-up",
        path: options.dropPath
      });
    }
    if (held && this.prevHeld !== held) {
      held.object3D.dispatchEvent({
        type: "holdable-button-down",
        path: options.grabPath
      });
    }

    this.prevHeld = held;
  }
}
