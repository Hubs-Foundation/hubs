import { sets } from "./sets";

let leftTeleporter;
let rightTeleporter;
let cursorController;

export function resolveActionSets() {
  leftTeleporter = leftTeleporter || document.querySelector("#player-left-controller").components["teleporter"];
  rightTeleporter = rightTeleporter || document.querySelector("#player-right-controller").components["teleporter"];
  cursorController = cursorController || document.querySelector("#cursor-controller").components["cursor-controller"];

  const userinput = AFRAME.scenes[0].systems.userinput;
  //  userinput.toggleSet(sets.leftHandHoveringOnInteractable, leftHandHoveringOnInteractable);
  //  userinput.toggleSet(sets.leftHandHoveringOnPen, leftHandHoveringOnPen);
  //  userinput.toggleSet(sets.leftHandHoveringOnCamera, leftHandHoveringOnCamera);
  //  userinput.toggleSet(sets.leftHandHoveringOnNothing, leftHandHoveringOnNothing);
  //  userinput.toggleSet(sets.leftHandHoldingPen, leftHandHoldingPen);
  //  userinput.toggleSet(sets.leftHandHoldingInteractable, leftHandHoldingInteractable);
  //  userinput.toggleSet(sets.leftHandHoldingCamera, leftHandHoldingCamera);
  //  userinput.toggleSet(sets.leftHandTeleporting, leftHandTeleporting);
  //
  //  userinput.toggleSet(sets.rightHandHoveringOnInteractable, rightHandHoveringOnInteractable);
  //  userinput.toggleSet(sets.rightHandHoveringOnPen, rightHandHoveringOnPen);
  //  userinput.toggleSet(sets.rightHandHoveringOnNothing, rightHandHoveringOnNothing);
  //  userinput.toggleSet(sets.rightHandHoveringOnCamera, rightHandHoveringOnCamera);
  //  userinput.toggleSet(sets.rightHandHoldingPen, rightHandHoldingPen);
  //  userinput.toggleSet(sets.rightHandHoldingInteractable, rightHandHoldingInteractable);
  //  userinput.toggleSet(sets.rightHandTeleporting, rightHandTeleporting);
  //  userinput.toggleSet(sets.rightHandHoldingCamera, rightHandHoldingCamera);

  const interaction = AFRAME.scenes[0].systems.interaction;

  const rightHandConstraintTarget = interaction.rightHandConstraintTarget;
  const rightHandCollisionTarget = !rightHandConstraintTarget && interaction.rightHandCollisionTarget;
  userinput.toggleSet(sets.rightHandHoveringOnNothing, !rightHandConstraintTarget && !rightHandCollisionTarget);
  userinput.toggleSet(
    sets.rightHandHoveringOnPen,
    rightHandCollisionTarget && !!rightHandCollisionTarget.components["is-pen"]
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnCamera,
    rightHandCollisionTarget && !!rightHandCollisionTarget.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnInteractable,
    rightHandCollisionTarget &&
      (!!rightHandCollisionTarget.components["offers-remote-constraint"] ||
        !!rightHandCollisionTarget.components["super-spawner"])
  );
  // userinput.toggleSet(
  //   sets.rightHandHoveringOnUI,
  //   rightHandCollisionTarget && !!rightHandCollisionTarget.components["is-ui"]
  // );
  userinput.toggleSet(
    sets.rightHandHoveringOnVideo,
    rightHandCollisionTarget && !!rightHandCollisionTarget.components["media-video"]
  );

  userinput.toggleSet(
    sets.rightHandHoldingPen,
    rightHandConstraintTarget && !!rightHandConstraintTarget.components["is-pen"]
  );
  userinput.toggleSet(
    sets.rightHandHoldingCamera,
    rightHandConstraintTarget && !!rightHandConstraintTarget.components["camera-tool"]
  );
  // userinput.toggleSet(sets.rightHandHoldingUI, !!interaction.grabbedUI);
  userinput.toggleSet(sets.rightHandHoldingInteractable, !!rightHandConstraintTarget);
  userinput.toggleSet(
    sets.inputFocused,
    document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName === "TEXTAREA"
  );

  const rightRemoteConstraintTarget = interaction.rightRemoteConstraintTarget;
  const rightRemoteHoverTarget =
    !rightHandConstraintTarget &&
    !rightHandCollisionTarget &&
    !rightRemoteConstraintTarget &&
    cursorController.rightRemoteHoverTarget;
  userinput.toggleSet(
    sets.cursorHoveringOnNothing,
    !rightHandConstraintTarget && !rightHandCollisionTarget && !rightRemoteConstraintTarget && !rightRemoteHoverTarget
  );
  userinput.toggleSet(
    sets.cursorHoveringOnPen,
    rightRemoteHoverTarget && !!rightRemoteHoverTarget.components["is-pen"]
  );
  userinput.toggleSet(
    sets.cursorHoveringOnCamera,
    rightRemoteHoverTarget && !!rightRemoteHoverTarget.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.cursorHoveringOnInteractable,
    rightRemoteHoverTarget &&
      (!!rightRemoteHoverTarget.components["offers-remote-constraint"] ||
        !!rightRemoteHoverTarget.components["super-spawner"])
  );
  userinput.toggleSet(
    sets.cursorHoveringOnUI,
    !interaction.buttonHeldByRightRemote &&
      rightRemoteHoverTarget &&
      (!!rightRemoteHoverTarget.components["single-action-button"] ||
        !!rightRemoteHoverTarget.components["holdable-button"])
  );
  userinput.toggleSet(
    sets.cursorHoveringOnVideo,
    rightRemoteHoverTarget && !!rightRemoteHoverTarget.components["media-video"]
  );

  userinput.toggleSet(
    sets.cursorHoldingPen,
    rightRemoteConstraintTarget && !!rightRemoteConstraintTarget.components["is-pen"]
  );
  userinput.toggleSet(
    sets.cursorHoldingCamera,
    rightRemoteConstraintTarget && !!rightRemoteConstraintTarget.components["camera-tool"]
  );
  userinput.toggleSet(sets.cursorHoldingUI, !!interaction.buttonHeldByRightRemote);
  userinput.toggleSet(sets.cursorHoldingInteractable, !!rightRemoteConstraintTarget);
  userinput.toggleSet(
    sets.inputFocused,
    document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName === "TEXTAREA"
  );
}
