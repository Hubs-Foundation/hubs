import { sets } from "./sets";
import { isUI, isHoverableByHand, isHoverableByRemote } from "./../interactions";
import { CAMERA_MODE_INSPECT } from "../camera-system";
import qsTruthy from "../../utils/qs_truthy";
const debugUserInput = qsTruthy("dui");
import { isTagged } from "../../components/tags";

export function hasAFrameComponent(entity, componentName) {
  if (!entity) {
    return false;
  }

  if (entity.isECSYEntity) {
    return false;
  }

  return !!entity.components[componentName];
}

let leftTeleporter, rightTeleporter;

export function resolveActionSets() {
  leftTeleporter =
    leftTeleporter ||
    (document.getElementById("player-left-controller") &&
      document.getElementById("player-left-controller").components.teleporter);
  rightTeleporter =
    rightTeleporter ||
    (document.getElementById("player-right-controller") &&
      document.getElementById("player-right-controller").components.teleporter);
  if (!leftTeleporter || !rightTeleporter) return;
  const userinput = AFRAME.scenes[0].systems.userinput;
  const { leftHand, rightHand, rightRemote, leftRemote } = AFRAME.scenes[0].systems.interaction.state;

  userinput.toggleSet(sets.leftHandHoldingInteractable, leftHand.held);
  userinput.toggleSet(sets.rightHandHoldingInteractable, rightHand.held);
  userinput.toggleSet(sets.leftCursorHoldingInteractable, leftRemote.held);
  userinput.toggleSet(sets.rightCursorHoldingInteractable, rightRemote.held);

  userinput.toggleSet(
    sets.leftHandHoveringOnNothing,
    !leftRemote.held && !leftRemote.hovered && !leftHand.held && !leftHand.hovered
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnNothing,
    !rightRemote.held && !rightRemote.hovered && !rightHand.held && !rightHand.hovered
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnNothing,
    !leftHand.held && !leftHand.hovered && !leftRemote.held && !leftRemote.hovered
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnNothing,
    !rightHand.held && !rightHand.hovered && !rightRemote.held && !rightRemote.hovered
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnPen,
    !leftHand.held && leftHand.hovered && isTagged(leftHand.hovered, "isPen")
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnPen,
    !rightHand.held && rightHand.hovered && isTagged(rightHand.hovered, "isPen")
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnPen,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      isTagged(leftRemote.hovered, "isPen")
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnPen,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      isTagged(rightRemote.hovered, "isPen")
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnCamera,
    !leftHand.held && leftHand.hovered && hasAFrameComponent(leftHand.hovered, "camera-tool")
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnCamera,
    !rightHand.held && rightHand.hovered && hasAFrameComponent(rightHand.hovered, "camera-tool")
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnCamera,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      hasAFrameComponent(leftRemote.hovered, "camera-tool")
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnCamera,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      hasAFrameComponent(rightRemote.hovered, "camera-tool")
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnInteractable,
    !leftHand.held &&
      leftHand.hovered &&
      (isTagged(leftHand.hovered, "offersHandConstraint") ||
        isHoverableByHand(leftHand.hovered) ||
        hasAFrameComponent(leftHand.hovered, "super-spawner"))
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnInteractable,
    !rightHand.held &&
      rightHand.hovered &&
      (isTagged(rightHand.hovered, "offersHandConstraint") ||
        isHoverableByHand(rightHand.hovered) ||
        hasAFrameComponent(rightHand.hovered, "super-spawner"))
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnInteractable,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      (isTagged(leftRemote.hovered, "offersHandConstraint") ||
        isTagged(leftRemote.hovered, "togglesHoveredActionSet") ||
        isHoverableByRemote(leftRemote.hovered) ||
        hasAFrameComponent(leftRemote.hovered, "super-spawner"))
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnInteractable,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      (isTagged(rightRemote.hovered, "offersRemoteConstraint") ||
        isTagged(rightRemote.hovered, "togglesHoveredActionSet") ||
        isHoverableByRemote(rightRemote.hovered) ||
        hasAFrameComponent(rightRemote.hovered, "super-spawner"))
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnVideo,
    !leftHand.held && leftHand.hovered && hasAFrameComponent(leftHand.hovered, "media-video")
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnVideo,
    !rightHand.held && rightHand.hovered && hasAFrameComponent(rightHand.hovered, "media-video")
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnVideo,
    !leftHand.held && !leftHand.hovered && !leftRemote.held && hasAFrameComponent(leftRemote.hovered, "media-video")
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnVideo,
    !rightHand.held && !rightHand.hovered && !rightRemote.held && hasAFrameComponent(rightRemote.hovered, "media-video")
  );

  userinput.toggleSet(sets.leftHandHoldingPen, leftHand.held && isTagged(leftHand.held, "isPen"));
  userinput.toggleSet(sets.rightHandHoldingPen, rightHand.held && isTagged(rightHand.held, "isPen"));
  userinput.toggleSet(
    sets.rightCursorHoldingPen,
    !rightHand.held && !rightHand.hovered && rightRemote.held && isTagged(rightRemote.held, "isPen")
  );
  userinput.toggleSet(
    sets.leftCursorHoldingPen,
    !leftHand.held && !leftHand.hovered && leftRemote.held && isTagged(leftRemote.held, "isPen")
  );
  userinput.toggleSet(sets.leftHandHoldingCamera, leftHand.held && hasAFrameComponent(leftHand.hovered, "camera-tool"));
  userinput.toggleSet(
    sets.rightHandHoldingCamera,
    rightHand.held && hasAFrameComponent(rightHand.hovered, "camera-tool")
  );
  userinput.toggleSet(
    sets.leftCursorHoldingCamera,
    !leftHand.held && !leftHand.hovered && leftRemote.held && hasAFrameComponent(leftRemote.hovered, "camera-tool")
  );
  userinput.toggleSet(
    sets.rightCursorHoldingCamera,
    !rightHand.held && !rightHand.hovered && rightRemote.held && hasAFrameComponent(rightRemote.hovered, "camera-tool")
  );

  userinput.toggleSet(
    sets.leftCursorHoveringOnUI,
    !leftHand.held && !leftHand.hovered && !leftRemote.held && isUI(leftRemote.hovered)
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnUI,
    !rightHand.held && !rightHand.hovered && !rightRemote.held && isUI(rightRemote.hovered)
  );

  userinput.toggleSet(sets.leftCursorHoldingNothing, !leftHand.held && !leftRemote.held);
  userinput.toggleSet(sets.rightCursorHoldingNothing, !rightHand.held && !rightRemote.held);

  userinput.toggleSet(
    sets.leftCursorHoldingUI,
    !leftHand.held && !leftHand.hovered && leftRemote.held && isTagged(leftRemote.held, "holdableButton")
  );
  userinput.toggleSet(
    sets.rightCursorHoldingUI,
    !rightHand.held && !rightHand.hovered && rightRemote.held && isTagged(rightRemote.held, "holdableButton")
  );

  userinput.toggleSet(sets.leftHandTeleporting, leftTeleporter.isTeleporting);
  userinput.toggleSet(sets.rightHandTeleporting, rightTeleporter.isTeleporting);

  userinput.toggleSet(
    sets.inputFocused,
    document.activeElement.nodeName === "INPUT" ||
      document.activeElement.nodeName === "TEXTAREA" ||
      document.activeElement.contentEditable === "true"
  );

  userinput.toggleSet(sets.debugUserInput, debugUserInput);

  if (AFRAME.scenes[0] && AFRAME.scenes[0].systems["hubs-systems"]) {
    userinput.toggleSet(
      sets.inspecting,
      AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT
    );
  }
}
