import { sets } from "./sets";

export function updateActionSetsBasedOnSuperhands() {
  const rightHandState = document.querySelector("#player-right-controller").components["super-hands"].state;
  const leftHandState = document.querySelector("#player-left-controller").components["super-hands"].state;
  const cursorHand = document.querySelector("#cursor").components["super-hands"].state;
  const leftTeleporter = document.querySelector("#player-left-controller").components["teleport-controls"];
  const rightTeleporter = document.querySelector("#player-right-controller").components["teleport-controls"];
  const cursorController = document.querySelector("#cursor-controller").components["cursor-controller"];

  const leftHandHoveringOnInteractable =
    !leftTeleporter.active &&
    leftHandState.has("hover-start") &&
    leftHandState.get("hover-start").matches(".interactable, .interactable *");
  const leftHandHoveringOnPen =
    !leftTeleporter.active &&
    leftHandState.has("hover-start") &&
    leftHandState.get("hover-start").matches(".pen, .pen *");
  const leftHandHoveringOnCamera =
    !leftTeleporter.active &&
    leftHandState.has("hover-start") &&
    leftHandState.get("hover-start").matches(".icamera, .icamera *");
  const leftHandHoldingInteractable =
    !leftTeleporter.active &&
    leftHandState.has("grab-start") &&
    leftHandState.get("grab-start").matches(".interactable, .interactable *");
  const leftHandHoldingPen =
    !leftTeleporter.active &&
    leftHandState.has("grab-start") &&
    leftHandState.get("grab-start").matches(".pen, .pen *");
  const leftHandHoldingCamera =
    !leftTeleporter.active &&
    leftHandState.has("grab-start") &&
    leftHandState.get("grab-start").matches(".icamera, .icamera *");
  const leftHandHovering = !leftTeleporter.active && leftHandState.has("hover-start");
  const leftHandHoveringOnNothing = !leftHandHovering && !leftHandState.has("grab-start");
  const leftHandTeleporting = leftTeleporter.active;

  const cursorGrabbing = cursorHand.has("grab-start");

  const rightHandTeleporting = rightTeleporter.active;
  const rightHandHovering = !rightHandTeleporting && !cursorGrabbing && rightHandState.has("hover-start");
  const rightHandGrabbing = !rightHandTeleporting && !cursorGrabbing && rightHandState.has("grab-start");

  const rightHandHoveringOnInteractable =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHandState.has("hover-start") &&
    rightHandState.get("hover-start").matches(".interactable, .interactable *");
  const rightHandHoveringOnPen =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHandState.has("hover-start") &&
    rightHandState.get("hover-start").matches(".pen, .pen *");
  const rightHandHoveringOnCamera =
    !rightTeleporter.active &&
    !cursorGrabbing &&
    rightHandState.has("hover-start") &&
    rightHandState.get("hover-start").matches(".icamera, .icamera *");
  const rightHandHoldingInteractable =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHandState.has("grab-start") &&
    rightHandState.get("grab-start").matches(".interactable, .interactable *");
  const rightHandHoldingPen =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHandState.has("grab-start") &&
    rightHandState.get("grab-start").matches(".pen, .pen *");
  const rightHandHoldingCamera =
    !rightTeleporter.active &&
    !cursorGrabbing &&
    rightHandState.has("grab-start") &&
    rightHandState.get("grab-start").matches(".icamera, .icamera *");

  const rightHandHoveringOnNothing =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !cursorHand.has("hover-start") &&
    !cursorGrabbing &&
    !rightHandState.has("grab-start");

  const cursorHoveringOnInteractable =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    cursorHand.has("hover-start") &&
    cursorHand.get("hover-start").matches(".interactable, .interactable *");
  const cursorHoveringOnCamera =
    !rightTeleporter.active &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    (cursorHand.has("hover-start") && cursorHand.get("hover-start").matches(".icamera, .icamera *"));
  const cursorHoveringOnUI =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    (cursorHand.has("hover-start") && cursorHand.get("hover-start").matches(".ui, .ui *"));
  const cursorHoveringOnPen =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    cursorHand.has("hover-start") &&
    cursorHand.get("hover-start").matches(".pen, .pen *");
  const cursorHoldingInteractable =
    !rightHandTeleporting &&
    cursorHand.has("grab-start") &&
    cursorHand.get("grab-start").matches(".interactable, .interactable *");
  const cursorHoldingPen =
    !rightHandTeleporting && cursorHand.has("grab-start") && cursorHand.get("grab-start").matches(".pen, .pen *");

  const cursorHoldingCamera =
    !rightTeleporter.active &&
    cursorHand.has("grab-start") &&
    cursorHand.get("grab-start").matches(".icamera, .icamera *");

  const cursorHoveringOnNothing =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    !cursorHand.has("hover-start") &&
    !cursorHand.has("grab-start") &&
    !cursorHoveringOnUI;

  if (rightHandTeleporting || rightHandHovering || rightHandGrabbing) {
    cursorController.disable();
  } else {
    cursorController.enable();
  }

  const userinput = AFRAME.scenes[0].systems.userinput;
  userinput.toggleActive(sets.leftHandHoveringOnInteractable, leftHandHoveringOnInteractable);
  userinput.toggleActive(sets.leftHandHoveringOnPen, leftHandHoveringOnPen);
  userinput.toggleActive(sets.leftHandHoveringOnCamera, leftHandHoveringOnCamera);
  userinput.toggleActive(sets.leftHandHoveringOnNothing, leftHandHoveringOnNothing);
  userinput.toggleActive(sets.leftHandHoldingPen, leftHandHoldingPen);
  userinput.toggleActive(sets.leftHandHoldingInteractable, leftHandHoldingInteractable);
  userinput.toggleActive(sets.leftHandHoldingCamera, leftHandHoldingCamera);
  userinput.toggleActive(sets.leftHandTeleporting, leftHandTeleporting);

  userinput.toggleActive(sets.rightHandHoveringOnInteractable, rightHandHoveringOnInteractable);
  userinput.toggleActive(sets.rightHandHoveringOnPen, rightHandHoveringOnPen);
  userinput.toggleActive(sets.rightHandHoveringOnNothing, rightHandHoveringOnNothing);
  userinput.toggleActive(sets.rightHandHoveringOnCamera, rightHandHoveringOnCamera);
  userinput.toggleActive(sets.rightHandHoldingPen, rightHandHoldingPen);
  userinput.toggleActive(sets.rightHandHoldingInteractable, rightHandHoldingInteractable);
  userinput.toggleActive(sets.rightHandTeleporting, rightHandTeleporting);
  userinput.toggleActive(sets.rightHandHoldingCamera, rightHandHoldingCamera);

  userinput.toggleActive(sets.cursorHoveringOnPen, cursorHoveringOnPen);
  userinput.toggleActive(sets.cursorHoveringOnCamera, cursorHoveringOnCamera);
  userinput.toggleActive(sets.cursorHoveringOnInteractable, cursorHoveringOnInteractable);
  userinput.toggleActive(sets.cursorHoveringOnUI, cursorHoveringOnUI);
  userinput.toggleActive(sets.cursorHoveringOnNothing, cursorHoveringOnNothing);
  userinput.toggleActive(sets.cursorHoldingPen, cursorHoldingPen);
  userinput.toggleActive(sets.cursorHoldingCamera, cursorHoldingCamera);
  userinput.toggleActive(sets.cursorHoldingInteractable, cursorHoldingInteractable);
}
