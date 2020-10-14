import { paths } from "./userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { isTagged } from "../components/tags";
import { CAMERA_MODE_INSPECT } from "../systems/camera-system";
import { hackyMobileSafariTest } from "../utils/detect-touchscreen";

function shouldEnableRemote(scene, hand, remote, teleporting, woke) {
  const vrRemotePenIntersection =
    scene.is("vr-mode") && isTagged(remote.held, "isPen") && remote.held.children[0].components.pen.intersection;
  return scene.is("entered") && !hand.hovered && !hand.held && !teleporting && !vrRemotePenIntersection && woke;
}

export class CursorTogglingSystem {
  constructor() {
    this.wakeLeft = false;
    this.wakeRight = false;

    waitForDOMContentLoaded().then(() => {
      this.domContentLoadedButComponentsMayNotHave = true;
    });
  }

  tick(interaction, userinput, scene) {
    if (!this.domContentLoadedButComponentsMayNotHave) return;
    if (!this.gotComponentReferences) {
      this.gotComponentReferences = true;
      this.rightCursorController = document.getElementById("right-cursor-controller").components["cursor-controller"];
      this.leftCursorController = document.getElementById("left-cursor-controller").components["cursor-controller"];
      this.rightHandTeleporter = document.getElementById("player-right-controller").components["teleporter"];
      this.leftHandTeleporter = document.getElementById("player-left-controller").components["teleporter"];
      this.gazeTeleporter = document.getElementById("gaze-teleport").components["teleporter"];
    }

    const rightRemote = interaction.state.rightRemote;
    const leftRemote = interaction.state.leftRemote;
    const leftHand = interaction.state.leftHand;
    const rightHand = interaction.state.rightHand;

    if (userinput.get(paths.actions.cursor.right.wake)) {
      this.wakeRight = true;
      if (!leftRemote.held) {
        this.wakeLeft = false;
      }
    }

    if (userinput.get(paths.actions.cursor.left.wake)) {
      this.wakeLeft = true;
      if (!rightRemote.held) {
        this.wakeRight = false;
      }
    }

    const inspecting = interaction.el.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT;
    const shouldEnableLeftRemote =
      !inspecting &&
      shouldEnableRemote(
        scene,
        leftHand,
        leftRemote,
        this.leftHandTeleporter.isTeleporting || this.gazeTeleporter.isTeleporting,
        this.wakeLeft
      );
    const isMobile = AFRAME.utils.device.isMobile();
    const shouldEnableRightRemote =
      isMobile ||
      hackyMobileSafariTest() ||
      (!inspecting &&
        shouldEnableRemote(
          scene,
          rightHand,
          rightRemote,
          this.rightHandTeleporter.isTeleporting || this.gazeTeleporter.isTeleporting,
          this.wakeRight
        ));

    if (!shouldEnableLeftRemote) {
      leftRemote.hovered = null;
    }
    if (!shouldEnableRightRemote) {
      rightRemote.hovered = null;
    }
    this.leftCursorController.enabled = shouldEnableLeftRemote;
    this.rightCursorController.enabled = shouldEnableRightRemote;
  }
}
