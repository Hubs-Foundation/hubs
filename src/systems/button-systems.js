import { CAMERA_MODE_INSPECT } from "./camera-system";

export class SingleActionButtonSystem {
  tick() {
    this.didInteractThisFrame = false;
    const interaction = AFRAME.scenes[0].systems.interaction;
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT) {
      // TODO: Fix issue where button objects are "visible" but not on the inspect layer,
      // which makes it so we can interact with them but cannot see them.
      return;
    }
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
    const hovered2 = interaction.state.leftRemote.hovered;
    if (
      hovered2 &&
      userinput.get(interaction.options.leftRemote.grabPath) &&
      hovered2.components.tags &&
      hovered2.components.tags.data.singleActionButton
    ) {
      this.didInteractThisFrame = true;
      hovered2.object3D.dispatchEvent({
        type: "interact",
        object3D: interaction.options.leftRemote.entity.object3D
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

    const heldLeft = interaction.state.leftRemote.held;

    if (this.prevHeldLeft && this.prevHeldLeft !== heldLeft) {
      this.prevHeldLeft.object3D.dispatchEvent({
        type: "holdable-button-up",
        object3D: interaction.options.leftRemote.entity.object3D
      });
    }
    if (heldLeft && this.prevHeldLeft !== heldLeft) {
      heldLeft.object3D.dispatchEvent({
        type: "holdable-button-down",
        object3D: interaction.options.leftRemote.entity.object3D
      });
    }

    this.prevHeldLeft = heldLeft;
  }
}

const hasButtonComponent = (function() {
  const BUTTON_COMPONENT_NAMES = [
    "icon-button",
    "text-button",
    "pin-networked-object-button",
    "mic-button",
    "inspect-button"
  ];
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
  if (
    hasButtonComponent(hovered.components) ||
    hovered.classList.contains("teleport-waypoint-icon") ||
    hovered.classList.contains("occupiable-waypoint-icon")
  ) {
    return hovered;
  }
  if (hovered.children) {
    // TODO: not sure if looping thru children here is desireable, but we did this to accomodate the rounded-button mixins
    for (let i = 0; i < hovered.children.length; i++) {
      if (
        hasButtonComponent(hovered.children[i].components) ||
        hovered.children[i].classList.contains("teleport-waypoint-icon") ||
        hovered.children[i].classList.contains("occupiable-waypoint-icon")
      ) {
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
      if (
        hasButtonComponent(el.children[i].components) ||
        el.children[i].classList.contains("teleport-waypoint-icon") ||
        el.children[i].classList.contains("occupiable-waypoint-icon")
      ) {
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
    const button2 = getHoverableButton(interaction.state.leftRemote.hovered);

    if (this.prevButton && this.prevButton !== button) {
      dispatch(this.prevButton, UNHOVERED);
    }

    if (button && this.prevButton !== button) {
      dispatch(button, HOVERED);
    }

    this.prevButton = button;

    // TODO: hover should respect both remotes
    if (this.prevButtonLeft && this.prevButtonLeft !== button2) {
      dispatch(this.prevButtonLeft, UNHOVERED);
    }

    if (button2 && this.prevButtonLeft !== button2) {
      dispatch(button2, HOVERED);
    }

    this.prevButtonLeft = button2;
  }
}
