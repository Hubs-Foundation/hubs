import { hasComponent } from "bitecs";
import {
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  HoveredHandLeft,
  HoveredHandRight,
  Pen
} from "../bit-components";
import { CAMERA_MODE_INSPECT } from "../systems/camera-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { anyEntityWith } from "../utils/bit-utils";
import { hackyMobileSafariTest } from "../utils/detect-touchscreen";
import { paths } from "./userinput/paths";

function shouldEnableRemote(world, scene, handHovering, handHeld, remoteHeld, teleporting, woke) {
  const vrRemotePenIntersection =
    scene.is("vr-mode") &&
    remoteHeld &&
    hasComponent(world, Pen, remoteHeld) &&
    world.eid2obj.get(remoteHeld).el.children[0].components.pen.intersection;

  return scene.is("entered") && woke && !handHovering && !handHeld && !teleporting && !vrRemotePenIntersection;
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

    const world = APP.world;

    // TODO this is also in resolveActionSets. It might be we actually do want something like the legacy interaction system state
    const leftHandHovering = anyEntityWith(world, HoveredHandLeft);
    const leftHandHolding = anyEntityWith(world, HeldHandLeft);
    const leftRemoteHolding = anyEntityWith(world, HeldRemoteLeft);
    const rightHandHovering = anyEntityWith(world, HoveredHandRight);
    const rightHandHolding = anyEntityWith(world, HeldHandRight);
    const rightRemoteHolding = anyEntityWith(world, HeldRemoteRight);

    if (userinput.get(paths.actions.cursor.right.wake)) {
      this.wakeRight = true;
      if (!leftRemoteHolding) {
        this.wakeLeft = false;
      }
    }

    if (userinput.get(paths.actions.cursor.left.wake)) {
      this.wakeLeft = true;
      if (!rightRemoteHolding) {
        this.wakeRight = false;
      }
    }

    const inspecting = interaction.el.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT;
    const shouldEnableLeftRemote =
      !inspecting &&
      shouldEnableRemote(
        world,
        scene,
        leftHandHovering,
        leftHandHolding,
        leftRemoteHolding,
        this.leftHandTeleporter.isTeleporting || this.gazeTeleporter.isTeleporting,
        this.wakeLeft
      );
    const isMobile = AFRAME.utils.device.isMobile();
    const shouldEnableRightRemote =
      isMobile ||
      hackyMobileSafariTest() ||
      (!inspecting &&
        shouldEnableRemote(
          world,
          scene,
          rightHandHovering,
          rightHandHolding,
          rightRemoteHolding,
          this.rightHandTeleporter.isTeleporting || this.gazeTeleporter.isTeleporting,
          this.wakeRight
        ));

    this.leftCursorController.enabled = shouldEnableLeftRemote;
    this.rightCursorController.enabled = shouldEnableRightRemote;
  }
}
