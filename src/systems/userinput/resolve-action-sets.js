import { sets } from "./sets";
import { CAMERA_MODE_INSPECT } from "../camera-system";
import qsTruthy from "../../utils/qs_truthy";
import { isTagged } from "../../components/tags";
import { anyEntityWith } from "../../utils/bit-utils";
import {
  HeldRemoteRight,
  HeldRemoteLeft,
  HeldHandRight,
  HeldHandLeft,
  HoveredRemoteRight,
  HoveredRemoteLeft,
  HoveredHandRight,
  HoveredHandLeft,
  SingleActionButton,
  HoldableButton,
  Pen,
  OffersRemoteConstraint,
  TogglesHoveredActionSet
} from "../../bit-components";
import { hasComponent } from "bitecs";
const debugUserInput = qsTruthy("dui");

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

  const world = APP.world;
  // userinput.toggleSet(sets.leftHandHoldingInteractable, leftHand.held);
  // userinput.toggleSet(sets.rightHandHoldingInteractable, rightHand.held);
  // userinput.toggleSet(sets.leftCursorHoldingInteractable, leftRemote.held);
  // userinput.toggleSet(sets.rightCursorHoldingInteractable, rightRemote.held);
  userinput.toggleSet(sets.leftHandHoldingInteractable, anyEntityWith(world, HeldHandLeft));
  userinput.toggleSet(sets.rightHandHoldingInteractable, anyEntityWith(world, HeldHandRight));
  userinput.toggleSet(sets.leftCursorHoldingInteractable, anyEntityWith(world, HeldRemoteLeft));
  userinput.toggleSet(sets.rightCursorHoldingInteractable, anyEntityWith(world, HeldRemoteRight));

  userinput.toggleSet(sets.leftHandHoveringOnNothing, !anyEntityWith(world, HoveredHandLeft));
  userinput.toggleSet(sets.rightHandHoveringOnNothing, !anyEntityWith(world, HoveredHandRight));
  userinput.toggleSet(sets.leftCursorHoveringOnNothing, !anyEntityWith(world, HoveredRemoteLeft));
  userinput.toggleSet(sets.rightCursorHoveringOnNothing, !anyEntityWith(world, HoveredRemoteRight));

  userinput.toggleSet(
    sets.leftHandHoveringOnPen,
    anyEntityWith(world, HoveredHandLeft) && hasComponent(world, Pen, anyEntityWith(world, HoveredHandLeft))
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnPen,
    anyEntityWith(world, HoveredHandRight) && hasComponent(world, Pen, anyEntityWith(world, HoveredHandRight))
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnPen,
    anyEntityWith(world, HoveredRemoteLeft) && hasComponent(world, Pen, anyEntityWith(world, HoveredRemoteLeft))
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnPen,
    anyEntityWith(world, HoveredRemoteRight) && hasComponent(world, Pen, anyEntityWith(world, HoveredRemoteRight))
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnCamera,
    !leftHand.held && leftHand.hovered && leftHand.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnCamera,
    !rightHand.held && rightHand.hovered && rightHand.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnCamera,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      leftRemote.hovered.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnCamera,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components["camera-tool"]
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnInteractable,
    !leftHand.held &&
      leftHand.hovered &&
      ((leftHand.hovered.components.tags && leftHand.hovered.components.tags.data.offersHandConstraint) ||
        leftHand.hovered.components["super-spawner"])
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnInteractable,
    !rightHand.held &&
      rightHand.hovered &&
      ((rightHand.hovered.components.tags && rightHand.hovered.components.tags.data.offersHandConstraint) ||
        rightHand.hovered.components["super-spawner"])
  );
  // userinput.toggleSet(
  //   sets.leftCursorHoveringOnInteractable,
  //   !leftHand.held &&
  //     !leftHand.hovered &&
  //     !leftRemote.held &&
  //     leftRemote.hovered &&
  //     ((leftRemote.hovered.components.tags && leftRemote.hovered.components.tags.data.offersRemoteConstraint) ||
  //       (leftRemote.hovered.components.tags && leftRemote.hovered.components.tags.data.togglesHoveredActionSet) ||
  //       leftRemote.hovered.components["super-spawner"])
  // );
  userinput.toggleSet(
    sets.leftCursorHoveringOnInteractable,
    anyEntityWith(world, HoveredRemoteLeft) &&
      (hasComponent(world, OffersRemoteConstraint, anyEntityWith(world, HoveredRemoteLeft)) ||
        hasComponent(world, TogglesHoveredActionSet, anyEntityWith(world, HoveredRemoteLeft)))
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnInteractable,
    anyEntityWith(world, HoveredRemoteRight) &&
      (hasComponent(world, OffersRemoteConstraint, anyEntityWith(world, HoveredRemoteRight)) ||
        hasComponent(world, TogglesHoveredActionSet, anyEntityWith(world, HoveredRemoteRight)))
  );

  userinput.toggleSet(
    sets.leftHandHoveringOnVideo,
    !leftHand.held && leftHand.hovered && leftHand.hovered.components["media-video"]
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnVideo,
    !rightHand.held && rightHand.hovered && rightHand.hovered.components["media-video"]
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnVideo,
    !leftHand.held &&
      !leftHand.hovered &&
      !leftRemote.held &&
      leftRemote.hovered &&
      leftRemote.hovered.components["media-video"]
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnVideo,
    !rightHand.held &&
      !rightHand.hovered &&
      !rightRemote.held &&
      rightRemote.hovered &&
      rightRemote.hovered.components["media-video"]
  );

  userinput.toggleSet(
    sets.leftHandHoldingPen,
    leftHand.held && leftHand.held.components.tags && leftHand.held.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightHandHoldingPen,
    rightHand.held && rightHand.held.components.tags && rightHand.held.components.tags.data.isPen
  );
  userinput.toggleSet(
    sets.rightCursorHoldingPen,
    !rightHand.held && !rightHand.hovered && rightRemote.held && isTagged(rightRemote.held, "isPen")
  );
  userinput.toggleSet(
    sets.leftCursorHoldingPen,
    !leftHand.held && !leftHand.hovered && leftRemote.held && isTagged(leftRemote.held, "isPen")
  );
  userinput.toggleSet(sets.leftHandHoldingCamera, leftHand.held && leftHand.held.components["camera-tool"]);
  userinput.toggleSet(sets.rightHandHoldingCamera, rightHand.held && rightHand.held.components["camera-tool"]);
  userinput.toggleSet(
    sets.leftCursorHoldingCamera,
    !leftHand.held && !leftHand.hovered && leftRemote.held && leftRemote.held.components["camera-tool"]
  );
  userinput.toggleSet(
    sets.rightCursorHoldingCamera,
    !rightHand.held && !rightHand.hovered && rightRemote.held && rightRemote.held.components["camera-tool"]
  );

  userinput.toggleSet(
    sets.leftCursorHoveringOnUI,
    anyEntityWith(world, HoveredRemoteLeft) &&
      (hasComponent(world, SingleActionButton, anyEntityWith(world, HoveredRemoteLeft)) ||
        hasComponent(world, HoldableButton, anyEntityWith(world, HoveredRemoteLeft)))
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnUI,
    anyEntityWith(world, HoveredRemoteRight) &&
      (hasComponent(world, SingleActionButton, anyEntityWith(world, HoveredRemoteRight)) ||
        hasComponent(world, HoldableButton, anyEntityWith(world, HoveredRemoteRight)))
  );

  userinput.toggleSet(sets.leftCursorHoldingNothing, !anyEntityWith(APP.world, HeldRemoteLeft));
  userinput.toggleSet(sets.rightCursorHoldingNothing, !anyEntityWith(APP.world, HeldRemoteRight));

  userinput.toggleSet(
    sets.leftCursorHoldingUI,
    anyEntityWith(APP.world, HeldRemoteLeft) &&
      hasComponent(APP.world, HoldableButton, anyEntityWith(APP.world, HeldRemoteLeft))
  );
  userinput.toggleSet(
    sets.rightCursorHoldingUI,
    anyEntityWith(APP.world, HeldRemoteRight) &&
      hasComponent(APP.world, HoldableButton, anyEntityWith(APP.world, HeldRemoteRight))
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
