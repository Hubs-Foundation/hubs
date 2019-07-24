export class SingleActionButtonSystem {
  tick() {
    this.didInteractThisFrame = false;
    const interaction = AFRAME.scenes[0].systems.interaction;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const hovered = interaction.state.rightRemote.hovered;
    if (
      hovered &&
      userinput.get(interaction.options.rightRemote.grabPath) &&
      hovered.components.tags &&
      hovered.components.tags.data.singleActionButton
    ) {
      this.didInteractThisFrame = true;
      hovered.object3D.dispatchEvent({
        type: "interact",
        object3D: interaction.options.rightRemote.entity.object3D
      });
    }
  }
}

export class HoldableButtonSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const held = interaction.state.rightRemote.held;

    if (this.prevHeld && this.prevHeld !== held) {
      this.prevHeld.object3D.dispatchEvent({
        type: "holdable-button-up",
        object3D: interaction.options.rightRemote.entity.object3D
      });
    }
    if (held && this.prevHeld !== held) {
      held.object3D.dispatchEvent({
        type: "holdable-button-down",
        object3D: interaction.options.rightRemote.entity.object3D
      });
    }

    this.prevHeld = held;
  }
}

const hasButtonComponent = (function() {
  const BUTTON_COMPONENT_NAMES = ["icon-button", "text-button", "pin-networked-object-button", "mic-button"];
  return function hasButtonComponent(components) {
    for (let i = 0; i < BUTTON_COMPONENT_NAMES.length; i++) {
      if (components[BUTTON_COMPONENT_NAMES[i]]) {
        return true;
      }
    }
    return false;
  };
})();

function getHoverableButton(hovered) {
  if (!hovered) return null;
  if (hasButtonComponent(hovered.components)) return hovered;
  if (hovered.children) {
    // TODO: not sure if looping thru children here is desireable, but we did this to accomodate the rounded-button mixins
    for (let i = 0; i < hovered.children.length; i++) {
      if (hasButtonComponent(hovered.children[i].components)) {
        return hovered.children[i];
      }
    }
  }
  return null;
}

function dispatch(el, event) {
  el.object3D.dispatchEvent(event);
  if (el.children) {
    for (let i = 0; i < el.children.length; i++) {
      if (hasButtonComponent(el.children[i].components)) {
        el.children[i].object3D.dispatchEvent(event);
      }
    }
  }
}

const HOVERED = { type: "hovered" };
const UNHOVERED = { type: "unhovered" };
export class HoverButtonSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const button = getHoverableButton(interaction.state.rightRemote.hovered);

    if (this.prevButton && this.prevButton !== button) {
      dispatch(this.prevButton, UNHOVERED);
    }

    if (button && this.prevButton !== button) {
      dispatch(button, HOVERED);
    }

    this.prevButton = button;
  }
}
