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

  const rightHandTeleporting = rightTeleporter.active;
  const rightHandHovering = !rightHandTeleporting && !cursorGrabbing && rightHand.has("hover-start");
  const rightHandGrabbing = !rightHandTeleporting && !cursorGrabbing && rightHand.has("grab-start");

  const rightHandHoveringOnInteractable =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHand.has("hover-start") &&
    rightHand.get("hover-start").matches(".interactable, .interactable *");
  const rightHandHoveringOnPen =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHand.has("hover-start") &&
    rightHand.get("hover-start").matches(".pen, .pen *");
  const rightHandHoldingInteractable =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHand.has("grab-start") &&
    rightHand.get("grab-start").matches(".interactable, .interactable *");
  const rightHandHoldingPen =
    !rightHandTeleporting &&
    !cursorGrabbing &&
    rightHand.has("grab-start") &&
    rightHand.get("grab-start").matches(".pen, .pen *");

  const rightHandHoveringOnNothing =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !cursorHand.has("hover-start") &&
    !cursorGrabbing &&
    !rightHand.has("grab-start");

  const cursorHoveringOnInteractable =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    cursorHand.has("hover-start") &&
    cursorHand.get("hover-start").matches(".interactable, .interactable *");
  const cursorHoveringOnUI =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    ((cursorHand.has("hover-start") && cursorHand.get("hover-start").matches(".ui, .ui *")) ||
      (cursorController.data.cursor.components["super-hands"].hoverEls.length &&
        cursorController.data.cursor.components["super-hands"].hoverEls[0].matches(".ui, .ui *"))); // Why isn't hover-start on the cursorHand?
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
  userinput.toggleActive(sets.leftHandHoveringOnNothing, leftHandHoveringOnNothing);
  userinput.toggleActive(sets.leftHandHoldingPen, leftHandHoldingPen);
  userinput.toggleActive(sets.leftHandHoldingInteractable, leftHandHoldingInteractable);

  userinput.toggleActive(sets.rightHandHoveringOnInteractable, rightHandHoveringOnInteractable);
  userinput.toggleActive(sets.rightHandHoveringOnPen, rightHandHoveringOnPen);
  userinput.toggleActive(sets.rightHandHoveringOnNothing, rightHandHoveringOnNothing);
  userinput.toggleActive(sets.rightHandHoldingPen, rightHandHoldingPen);
  userinput.toggleActive(sets.rightHandHoldingInteractable, rightHandHoldingInteractable);
  userinput.toggleActive(sets.rightHandTeleporting, rightHandTeleporting);

  userinput.toggleActive(sets.cursorHoveringOnPen, cursorHoveringOnPen);
  userinput.toggleActive(sets.cursorHoveringOnInteractable, cursorHoveringOnInteractable);
  userinput.toggleActive(sets.cursorHoveringOnUI, cursorHoveringOnUI);
  userinput.toggleActive(sets.cursorHoveringOnNothing, cursorHoveringOnNothing);
  userinput.toggleActive(sets.cursorHoldingPen, cursorHoldingPen);
  userinput.toggleActive(sets.cursorHoldingInteractable, cursorHoldingInteractable);

  // this.leftHandHoveringOnInteractable = leftHandHoveringOnInteractable;
  // this.leftHandHoveringOnPen = leftHandHoveringOnPen;
  // this.leftHandHoveringOnNothing = leftHandHoveringOnNothing;
  // this.leftHandHoldingPen = leftHandHoldingPen;
  // this.leftHandHoldingInteractable = leftHandHoldingInteractable;
  // this.rightHandHoveringOnInteractable = rightHandHoveringOnInteractable;
  // this.rightHandHoveringOnPen = rightHandHoveringOnPen;
  // this.rightHandHoveringOnNothing = rightHandHoveringOnNothing;
  // this.rightHandHoldingPen = rightHandHoldingPen;
  // this.rightHandHoldingInteractable = rightHandHoldingInteractable;
  // this.cursorHoveringOnInteractable = cursorHoveringOnInteractable;
  // this.cursorHoveringOnPen = cursorHoveringOnPen;
  // this.cursorHoveringOnNothing = cursorHoveringOnNothing;
  // this.cursorHoldingPen = cursorHoldingPen;
  // this.cursorHoldingInteractable = cursorHoldingInteractable;
}
