import { sets } from "./sets";

let rightHandState;
let leftHandState;
let cursorHand;
let leftTeleporter;
let rightTeleporter;
let cursorController;

export function resolveActionSets() {
  rightHandState = rightHandState || document.querySelector("#player-right-controller").components["super-hands"].state;
  leftHandState = leftHandState || document.querySelector("#player-left-controller").components["super-hands"].state;
  cursorHand = cursorHand || document.querySelector("#cursor").components["super-hands"].state;
  leftTeleporter = leftTeleporter || document.querySelector("#player-left-controller").components["teleport-controls"];
  rightTeleporter =
    rightTeleporter || document.querySelector("#player-right-controller").components["teleport-controls"];
  cursorController = cursorController || document.querySelector("#cursor-controller").components["cursor-controller"];

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
    leftHandState.has("grab-start") && leftHandState.get("grab-start").matches(".interactable, .interactable *");
  const leftHandHoldingPen = leftHandState.has("grab-start") && leftHandState.get("grab-start").matches(".pen, .pen *");
  const leftHandHoldingCamera =
    leftHandState.has("grab-start") && leftHandState.get("grab-start").matches(".icamera, .icamera *");
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
    !cursorGrabbing &&
    rightHandState.has("grab-start") &&
    rightHandState.get("grab-start").matches(".interactable, .interactable *");
  const rightHandHoldingPen =
    !cursorGrabbing && rightHandState.has("grab-start") && rightHandState.get("grab-start").matches(".pen, .pen *");
  const rightHandHoldingCamera =
    !cursorGrabbing &&
    rightHandState.has("grab-start") &&
    rightHandState.get("grab-start").matches(".icamera, .icamera *");

  const rightHandHoveringOnNothing =
    !rightHandTeleporting &&
    !rightHandHovering &&
    !cursorHand.has("hover-start") &&
    !cursorGrabbing &&
    !rightHandState.has("grab-start");

  // Cursor
  cursorController.enabled = !(rightHandTeleporting || rightHandHovering || rightHandGrabbing);

  const cursorHoveringOnUI =
    cursorController.enabled &&
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    (cursorHand.has("hover-start") && cursorHand.get("hover-start").matches(".ui, .ui *"));
  const cursorHoveringOnInteractable =
    cursorController.enabled &&
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    !cursorHoveringOnUI &&
    cursorHand.has("hover-start") &&
    cursorHand.get("hover-start").matches(".interactable, .interactable *");
  const cursorHoveringOnCamera =
    cursorController.enabled &&
    !rightTeleporter.active &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    !cursorHoveringOnUI &&
    (cursorHand.has("hover-start") && cursorHand.get("hover-start").matches(".icamera, .icamera *"));
  const cursorHoveringOnPen =
    cursorController.enabled &&
    !rightHandTeleporting &&
    !rightHandHovering &&
    !rightHandGrabbing &&
    !cursorHoveringOnUI &&
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

  const userinput = AFRAME.scenes[0].systems.userinput;
  userinput.toggleSet(sets.leftHandHoveringOnInteractable, leftHandHoveringOnInteractable);
  userinput.toggleSet(sets.leftHandHoveringOnPen, leftHandHoveringOnPen);
  userinput.toggleSet(sets.leftHandHoveringOnCamera, leftHandHoveringOnCamera);
  userinput.toggleSet(sets.leftHandHoveringOnNothing, leftHandHoveringOnNothing);
  userinput.toggleSet(sets.leftHandHoldingPen, leftHandHoldingPen);
  userinput.toggleSet(sets.leftHandHoldingInteractable, leftHandHoldingInteractable);
  userinput.toggleSet(sets.leftHandHoldingCamera, leftHandHoldingCamera);
  userinput.toggleSet(sets.leftHandTeleporting, leftHandTeleporting);

  userinput.toggleSet(sets.rightHandHoveringOnInteractable, rightHandHoveringOnInteractable);
  userinput.toggleSet(sets.rightHandHoveringOnPen, rightHandHoveringOnPen);
  userinput.toggleSet(sets.rightHandHoveringOnNothing, rightHandHoveringOnNothing);
  userinput.toggleSet(sets.rightHandHoveringOnCamera, rightHandHoveringOnCamera);
  userinput.toggleSet(sets.rightHandHoldingPen, rightHandHoldingPen);
  userinput.toggleSet(sets.rightHandHoldingInteractable, rightHandHoldingInteractable);
  userinput.toggleSet(sets.rightHandTeleporting, rightHandTeleporting);
  userinput.toggleSet(sets.rightHandHoldingCamera, rightHandHoldingCamera);

  userinput.toggleSet(sets.cursorHoveringOnPen, cursorHoveringOnPen);
  userinput.toggleSet(sets.cursorHoveringOnCamera, cursorHoveringOnCamera);
  userinput.toggleSet(sets.cursorHoveringOnInteractable, cursorHoveringOnInteractable);
  userinput.toggleSet(sets.cursorHoveringOnUI, cursorHoveringOnUI);
  userinput.toggleSet(sets.cursorHoveringOnNothing, cursorHoveringOnNothing);
  userinput.toggleSet(sets.cursorHoldingPen, cursorHoldingPen);
  userinput.toggleSet(sets.cursorHoldingCamera, cursorHoldingCamera);
  userinput.toggleSet(sets.cursorHoldingInteractable, cursorHoldingInteractable);
  userinput.toggleSet(
    sets.inputFocused,
    document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName === "TEXTAREA"
  );
}
