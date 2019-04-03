export class SingleActionButtonSystem {
  tick() {
    this.didInteractThisFrame = false;
    const interaction = AFRAME.scenes[0].systems.interaction;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const state = interaction.state.rightRemote;
    const grab = interaction.options.rightRemote.grabPath;
    if (
      userinput.get(grab) &&
      state.hovered &&
      state.hovered.components.tags &&
      state.hovered.components.tags.data.singleActionButton
    ) {
      this.didInteractThisFrame = true;
      state.hovered.object3D.dispatchEvent({
        type: "interact",
        path: grab
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

function getHoverableButton(hovered) {
  if (!hovered) return null;
  if (
    hovered.components["icon-button"] ||
    hovered.components["text-button"] ||
    hovered.components["pin-networked-object-button"]
  )
    return hovered;
  // TODO: fix this so that we aren't looping thru children here. I just did this to accomodate the new rounded buttons
  if (hovered.children) {
    for (let i = 0; i < hovered.children.length; i++) {
      if (
        hovered.children[i].components["icon-button"] ||
        hovered.children[i].components["text-button"] ||
        hovered.components["pin-networked-object-button"]
      ) {
        return hovered.children[i];
      }
    }
  }
  return null;
}
const HOVERED = { type: "hovered" };
const UNHOVERED = { type: "unhovered" };
export class HoverButtonSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const button = getHoverableButton(interaction.state.rightRemote.hovered);

    if (this.prevButton && this.prevButton !== button) {
      this.prevButton.object3D.dispatchEvent(UNHOVERED);
    }

    if (button && this.prevButton !== button) {
      button.object3D.dispatchEvent(HOVERED);
    }

    this.prevButton = button;
  }
}
