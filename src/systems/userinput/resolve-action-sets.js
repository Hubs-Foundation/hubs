import { sets } from "./sets";

export function updateActionSetsBasedOnSuperhands() {
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

  const userinput = AFRAME.scenes[0].systems.userinput;
  userinput.activate(sets.leftHandHoveringOnInteractable, leftHandHoveringOnInteractable);
  userinput.activate(sets.leftHandHoveringOnPen, leftHandHoveringOnPen);
  userinput.activate(sets.leftHandHoveringOnNothing, leftHandHoveringOnNothing);
  userinput.activate(sets.leftHandHoldingPen, leftHandHoldingPen);
  userinput.activate(sets.leftHandHoldingInteractable, leftHandHoldingInteractable);

  userinput.activate(sets.rightHandHoveringOnInteractable, rightHandHoveringOnInteractable);
  userinput.activate(sets.rightHandHoveringOnPen, rightHandHoveringOnPen);
  userinput.activate(sets.rightHandHoveringOnNothing, rightHandHoveringOnNothing);
  userinput.activate(sets.rightHandHoldingPen, rightHandHoldingPen);
  userinput.activate(sets.rightHandHoldingInteractable, rightHandHoldingInteractable);

  userinput.activate(sets.cursorHoveringOnPen, cursorHoveringOnPen);
  userinput.activate(sets.cursorHoveringOnInteractable, cursorHoveringOnInteractable);
  userinput.activate(sets.cursorHoveringOnNothing, cursorHoveringOnNothing);
  userinput.activate(sets.cursorHoldingPen, cursorHoldingPen);
  userinput.activate(sets.cursorHoldingInteractable, cursorHoldingInteractable);
}
