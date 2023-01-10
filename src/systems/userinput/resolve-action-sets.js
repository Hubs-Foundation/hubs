import { sets } from "./sets";
import { CAMERA_MODE_INSPECT } from "../camera-system";
import qsTruthy from "../../utils/qs_truthy";
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
  TogglesHoveredActionSet,
  CameraTool,
  OffersHandConstraint,
  AEntity,
  MediaVideo
} from "../../bit-components";
import { hasComponent } from "bitecs";
const debugUserInput = qsTruthy("dui");

let leftTeleporter, rightTeleporter;

function hc(world, Component, eid) {
  return eid && hasComponent(world, Component, eid);
}

function hcAFRAME(world, componentName, eid) {
  return eid && hasComponent(world, AEntity, eid) && !!world.eid2obj.get(eid).el.components[componentName];
}

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

  const world = APP.world;

  const leftHandHovering = anyEntityWith(world, HoveredHandLeft);
  const leftHandHolding = anyEntityWith(world, HeldHandLeft);
  const leftRemoteHovering = anyEntityWith(world, HoveredRemoteLeft);
  const leftRemoteHolding = anyEntityWith(world, HeldRemoteLeft);
  const rightHandHovering = anyEntityWith(world, HoveredHandRight);
  const rightHandHolding = anyEntityWith(world, HeldHandRight);
  const rightRemoteHovering = anyEntityWith(world, HoveredRemoteRight);
  const rightRemoteHolding = anyEntityWith(world, HeldRemoteRight);

  userinput.toggleSet(sets.leftHandHoldingInteractable, leftHandHolding);
  userinput.toggleSet(sets.rightHandHoldingInteractable, rightHandHolding);
  userinput.toggleSet(sets.leftCursorHoldingInteractable, leftRemoteHolding);
  userinput.toggleSet(sets.rightCursorHoldingInteractable, rightRemoteHolding);

  userinput.toggleSet(sets.leftHandHoveringOnNothing, !leftHandHovering);
  userinput.toggleSet(sets.rightHandHoveringOnNothing, !rightHandHovering);
  userinput.toggleSet(sets.leftCursorHoveringOnNothing, !leftRemoteHovering);
  userinput.toggleSet(sets.rightCursorHoveringOnNothing, !rightRemoteHovering);

  userinput.toggleSet(sets.leftHandHoveringOnPen, hc(world, Pen, leftHandHovering));
  userinput.toggleSet(sets.rightHandHoveringOnPen, hc(world, Pen, rightHandHovering));
  userinput.toggleSet(sets.leftCursorHoveringOnPen, hc(world, Pen, leftRemoteHovering));
  userinput.toggleSet(sets.rightCursorHoveringOnPen, hc(world, Pen, rightRemoteHovering));

  userinput.toggleSet(sets.leftHandHoveringOnCamera, hc(world, CameraTool, leftHandHovering));
  userinput.toggleSet(sets.rightHandHoveringOnCamera, hc(world, CameraTool, rightHandHovering));
  userinput.toggleSet(sets.leftCursorHoveringOnCamera, hc(world, CameraTool, leftRemoteHovering));
  userinput.toggleSet(sets.rightCursorHoveringOnCamera, hc(world, CameraTool, rightRemoteHovering));

  userinput.toggleSet(
    sets.leftHandHoveringOnInteractable,
    hc(world, OffersHandConstraint, leftHandHovering) || hcAFRAME(world, "super-spawner", leftHandHovering)
  );
  userinput.toggleSet(
    sets.rightHandHoveringOnInteractable,
    hc(world, OffersHandConstraint, rightHandHovering) || hcAFRAME(world, "super-spawner", rightHandHovering)
  );
  userinput.toggleSet(
    sets.leftCursorHoveringOnInteractable,
    hc(world, OffersRemoteConstraint, leftRemoteHovering) ||
      hc(world, TogglesHoveredActionSet, leftRemoteHovering) ||
      hcAFRAME(world, "super-spawner", leftRemoteHovering)
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnInteractable,
    hc(world, OffersRemoteConstraint, rightRemoteHovering) ||
      hc(world, TogglesHoveredActionSet, rightRemoteHovering) ||
      hcAFRAME(world, "super-spawner", rightRemoteHovering)
  );

  userinput.toggleSet(
    sets.leftCursorHoveringOnVideo,
    hcAFRAME(world, "media-video", leftRemoteHovering) || hc(world, MediaVideo, leftRemoteHovering)
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnVideo,
    hcAFRAME(world, "media-video", rightRemoteHovering) || hc(world, MediaVideo, rightRemoteHovering)
  );

  userinput.toggleSet(sets.leftHandHoldingPen, hc(world, Pen, leftHandHolding));
  userinput.toggleSet(sets.rightHandHoldingPen, hc(world, Pen, rightHandHolding));
  userinput.toggleSet(sets.leftCursorHoldingPen, hc(world, Pen, leftRemoteHolding));
  userinput.toggleSet(sets.rightCursorHoldingPen, hc(world, Pen, rightRemoteHolding));

  userinput.toggleSet(sets.leftHandHoldingCamera, hc(world, CameraTool, leftHandHolding));
  userinput.toggleSet(sets.rightHandHoldingCamera, hc(world, CameraTool, rightHandHolding));
  userinput.toggleSet(sets.leftCursorHoldingCamera, hc(world, CameraTool, leftRemoteHolding));
  userinput.toggleSet(sets.rightCursorHoldingCamera, hc(world, CameraTool, rightRemoteHolding));

  userinput.toggleSet(
    sets.leftCursorHoveringOnUI,
    hc(world, SingleActionButton, leftRemoteHovering) || hc(world, HoldableButton, leftRemoteHovering)
  );
  userinput.toggleSet(
    sets.rightCursorHoveringOnUI,
    hc(world, SingleActionButton, rightRemoteHovering) || hc(world, HoldableButton, rightRemoteHovering)
  );

  userinput.toggleSet(sets.leftCursorHoldingNothing, !leftRemoteHolding);
  userinput.toggleSet(sets.rightCursorHoldingNothing, !rightRemoteHolding);

  userinput.toggleSet(sets.leftCursorHoldingUI, hc(world, HoldableButton, leftRemoteHolding));
  userinput.toggleSet(sets.rightCursorHoldingUI, hc(world, HoldableButton, rightRemoteHolding));

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
