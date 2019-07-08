import { sets } from "./sets";

let leftTeleporter, rightTeleporter;

export function resolveActionSets() {
  leftTeleporter = leftTeleporter || document.querySelector("#player-left-controller").components.teleporter;
  rightTeleporter = rightTeleporter || document.querySelector("#player-right-controller").components.teleporter;
  const userinput = AFRAME.scenes[0].systems.userinput;
  const { leftHand, rightHand, rightRemote } = AFRAME.scenes[0].systems.interaction.state;

  userinput.toggleSet(sets.leftHandHoveringOnNothing, !leftHand.held && !leftHand.hovered);
  userinput.toggleSet(
    sets.leftHandHoveringOnPen,
    !leftHand.held &&
      leftHand.hovered &&
      leftHand.hovered.components.tags &&
      leftHand.hovered.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.leftHandHoveringOnCamera,
    !leftHand.held && leftHand.hovered && leftHand.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.leftHandHoveringOnInteractable,
    !leftHand.held &&
      (leftHand.hovered &&
        ((leftHand.hovered.components.tags && leftHand.hovered.components.tags.data.offersRemoteConstraint) ||
          leftHand.hovered.components["super-spawner"]))
  );
  userinput.toggleSet(
    sets.leftHandHoveringOnVideo,
    !leftHand.held && leftHand.hovered && leftHand.hovered.components["media-video"]
  );
  userinput.toggleSet(
    sets.leftHandHoldingPen,
    leftHand.held && leftHand.held.components.tags && leftHand.held.components.tags.data.isPen
  );
  userinput.toggleSet(sets.leftHandHoldingCamera, leftHand.held && leftHand.held.components["camera-tool"]);
  userinput.toggleSet(sets.leftHandHoldingInteractable, leftHand.held);

  userinput.toggleSet(
    sets.rightHandHoveringOnNothing,
    !rightRemote.held && !rightRemote.hovered && !rightHand.held && !rightHand.hovered
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnPen,
    !rightHand.held &&
      rightHand.hovered &&
      rightHand.hovered.components.tags &&
      rightHand.hovered.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnCamera,
    !rightHand.held && rightHand.hovered && rightHand.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnInteractable,
    !rightHand.held &&
      (rightHand.hovered &&
        ((rightHand.hovered.components.tags && rightHand.hovered.components.tags.data.offersRemoteConstraint) ||
          rightHand.hovered.components["super-spawner"]))
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnVideo,
    !rightHand.held && rightHand.hovered && rightHand.hovered.components["media-video"]
  );
  userinput.toggleSet(
    sets.rightHandHoldingPen,
    rightHand.held && rightHand.held.components.tags && rightHand.held.components.tags.data.isPen
  );
  userinput.toggleSet(sets.rightHandHoldingCamera, rightHand.held && rightHand.held.components["camera-tool"]);
  userinput.toggleSet(sets.rightHandHoldingInteractable, rightHand.held);

  userinput.toggleSet(
    sets.cursorHoveringOnNothing,
    !rightHand.held && !rightHand.hovered && !rightRemote.held && !rightRemote.hovered
  );
  userinput.toggleSet(
    sets.cursorHoveringOnPen,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components.tags &&
      rightRemote.hovered.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.cursorHoveringOnCamera,

    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.cursorHoveringOnInteractable,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      ((rightRemote.hovered.components.tags && rightRemote.hovered.components.tags.data.offersRemoteConstraint) ||
        rightRemote.hovered.components["super-spawner"])
  );
  userinput.toggleSet(
    sets.cursorHoveringOnUI,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      (rightRemote.hovered.components.tags &&
        (rightRemote.hovered.components.tags.data.singleActionButton ||
          rightRemote.hovered.components.tags.data.holdableButton))
  );
  userinput.toggleSet(
    sets.cursorHoveringOnVideo,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components["media-video"]
  );

  userinput.toggleSet(sets.cursorHoldingNothing, !rightHand.held && !rightRemote.held);
  userinput.toggleSet(
    sets.cursorHoldingPen,

    !rightHand.held &&
      !rightHand.hovered &&
      rightRemote.held &&
      rightRemote.held.components.tags &&
      rightRemote.held.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.cursorHoldingCamera,
    !rightHand.held && !rightHand.hovered && rightRemote.held && rightRemote.held.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.cursorHoldingUI,
    !rightHand.held &&
      !rightHand.hovered &&
      rightRemote.held &&
      rightRemote.held.components.tags &&
      rightRemote.held.components.tags.data.holdableButton
  );
  userinput.toggleSet(sets.cursorHoldingInteractable, rightRemote.held);

  userinput.toggleSet(sets.leftHandTeleporting, leftTeleporter.isTeleporting);
  userinput.toggleSet(sets.rightHandTeleporting, rightTeleporter.isTeleporting);

  userinput.toggleSet(
    sets.inputFocused,
    document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName === "TEXTAREA"
  );
}
