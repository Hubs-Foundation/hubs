import { sets } from "./sets";

export function updateActionSetsBasedOnSuperhands() {
  const actions = AFRAME.scenes[0].systems.actions;
  const rightHand = document.querySelector("#player-right-controller").components["super-hands"].state;
  const leftHand = document.querySelector("#player-left-controller").components["super-hands"].state;
  const cursorHand = document.querySelector("#cursor").components["super-hands"].state;
  const leftTeleporter = document.querySelector("#player-left-controller").components["teleport-controls"];
  const rightTeleporter = document.querySelector("#player-right-controller").components["teleport-controls"];
  const cursorController = document.querySelector("#cursor-controller").components["cursor-controller"];

  const leftHandHoveringOnInteractable =
    !leftTeleporter.active &&
    leftHand.has("hover-start") &&
    leftHand.get("hover-start").matches(".interactable, .interactable *");
  const leftHandHoveringOnPen =
    !leftTeleporter.active && leftHand.has("hover-start") && leftHand.get("hover-start").matches(".pen, .pen *");
  const leftHandHoldingInteractable =
    !leftTeleporter.active &&
    leftHand.has("grab-start") &&
    leftHand.get("grab-start").matches(".interactable, .interactable *");
  const leftHandHoldingPen =
    !leftTeleporter.active && leftHand.has("grab-start") && leftHand.get("grab-start").matches(".pen, .pen *");
  const leftHandHovering = !leftTeleporter.active && leftHand.has("hover-start");
  const leftHandHoveringOnNothing = !leftHandHovering && !leftHand.has("grab-start");

  const cursorGrabbing = cursorHand.has("grab-start");

  const rightHandHoveringOnInteractable =
    !rightTeleporter.active &&
    !cursorGrabbing &&
    rightHand.has("hover-start") &&
    rightHand.get("hover-start").matches(".interactable, .interactable *");
  const rightHandHoveringOnPen =
    !rightTeleporter.active &&
    !cursorGrabbing &&
    rightHand.has("hover-start") &&
    rightHand.get("hover-start").matches(".pen, .pen *");
  const rightHandHoldingInteractable =
    !rightTeleporter.active &&
    !cursorGrabbing &&
    rightHand.has("grab-start") &&
    rightHand.get("grab-start").matches(".interactable, .interactable *");
  const rightHandHoldingPen =
    !rightTeleporter.active &&
    !cursorGrabbing &&
    rightHand.has("grab-start") &&
    rightHand.get("grab-start").matches(".pen, .pen *");

  const rightHandHovering = !rightTeleporter.active && !cursorGrabbing && rightHand.has("hover-start");
  const rightHandGrabbing = !rightTeleporter.active && !cursorGrabbing && rightHand.has("grab-start");
  const rightHandHoveringOnNothing =
    !rightTeleporter.active &&
    !rightHandHovering &&
    !cursorHand.has("hover-start") &&
    !cursorGrabbing &&
    !rightHand.has("grab-start");

  const cursorHoveringOnInteractable =
    !rightTeleporter.active &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    cursorHand.has("hover-start") &&
    cursorHand.get("hover-start").matches(".interactable, .interactable *");
  const cursorHoveringOnPen =
    !rightTeleporter.active &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    cursorHand.has("hover-start") &&
    cursorHand.get("hover-start").matches(".pen, .pen *");
  const cursorHoldingInteractable =
    !rightTeleporter.active &&
    cursorHand.has("grab-start") &&
    cursorHand.get("grab-start").matches(".interactable, .interactable *");
  const cursorHoldingPen =
    !rightTeleporter.active && cursorHand.has("grab-start") && cursorHand.get("grab-start").matches(".pen, .pen *");

  const cursorHoveringOnNothing =
    !rightTeleporter.active &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    !cursorHand.has("hover-start") &&
    !cursorHand.has("grab-start");

  if (rightTeleporter.active || rightHandHovering || rightHandGrabbing) {
    cursorController.disable();
  } else {
    cursorController.enable();
  }

  actions.activate(sets.leftHandHoveringOnInteractable, leftHandHoveringOnInteractable);
  actions.activate(sets.leftHandHoveringOnPen, leftHandHoveringOnPen);
  actions.activate(sets.leftHandHoveringOnNothing, leftHandHoveringOnNothing);
  actions.activate(sets.leftHandHoldingPen, leftHandHoldingPen);
  actions.activate(sets.leftHandHoldingInteractable, leftHandHoldingInteractable);

  actions.activate(sets.rightHandHoveringOnInteractable, rightHandHoveringOnInteractable);
  actions.activate(sets.rightHandHoveringOnPen, rightHandHoveringOnPen);
  actions.activate(sets.rightHandHoveringOnNothing, rightHandHoveringOnNothing);
  actions.activate(sets.rightHandHoldingPen, rightHandHoldingPen);
  actions.activate(sets.rightHandHoldingInteractable, rightHandHoldingInteractable);

  actions.activate(sets.cursorHoveringOnPen, cursorHoveringOnPen);
  actions.activate(sets.cursorHoveringOnInteractable, cursorHoveringOnInteractable);
  actions.activate(sets.cursorHoveringOnNothing, cursorHoveringOnNothing);
  actions.activate(sets.cursorHoldingPen, cursorHoldingPen);
  actions.activate(sets.cursorHoldingInteractable, cursorHoldingInteractable);
}
