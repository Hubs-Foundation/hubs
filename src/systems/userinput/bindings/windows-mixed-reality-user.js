import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

export const oculusTouchUserBindings = addSetsToBindings({
  [sets.global]: [],

  [sets.leftHandHoveringOnNothing]: [],
  [sets.cursorHoveringOnNothing]: [],
  [sets.rightHandHoveringOnNothing]: [],

  [sets.cursorHoveringOnUI]: [],

  [sets.leftHandHoveringOnInteractable]: [],
  [sets.cursorHoveringOnInteractable]: [],
  [sets.rightHandHoveringOnInteractable]: [],

  [sets.leftHandHoldingInteractable]: [],
  [sets.cursorHoldingInteractable]: [],
  [sets.rightHandHoldingInteractable]: [],

  [sets.leftHandHoveringOnPen]: [],
  [sets.cursorHoveringOnPen]: [],
  [sets.rightHandHoveringOnPen]: [],

  [sets.leftHandHoldingPen]: [],
  [sets.cursorHoldingPen]: [],
  [sets.rightHandHoldingPen]: [],

  [sets.leftHandHoveringOnCamera]: [],
  [sets.cursorHoveringOnCamera]: [],
  [sets.rightHandHoveringOnCamera]: [],

  [sets.leftHandHoldingCamera]: [],
  [sets.cursorHoldingCamera]: [],
  [sets.rightHandHoldingCamera]: [],

  [sets.inputFocused]: []
});
