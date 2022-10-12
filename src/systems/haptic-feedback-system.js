import { paths } from "./userinput/paths";
import { distanceBetweenStretchers } from "./two-point-stretching-system";

function copyState(previous, current, isTeleporting) {
  previous.held = current.held;
  previous.hovered = current.hovered;
  previous.isTeleporting = isTeleporting;
}

// TODO: These strengths should be written into bindings, since vibration strength varies across devices.
const STRENGTH = {
  DROP: 0.1,
  PICKUP: 0.2,
  BUTTON_PRESSED: 0.2,
  HOVER: 0.08,
  STRETCH_BASE: 0.05,
  STRETCH_DISTANCE: 0.2,
  TELEPORTING: 0.08,
  TELEPORTED: 0.2
};

function determineStrength(previous, current, isTeleporting) {
  if (previous.held && !current.held) {
    return STRENGTH.DROP;
  } else if (!previous.held && current.held) {
    return STRENGTH.PICKUP;
  } else if (!previous.hovered && current.hovered) {
    return STRENGTH.HOVER;
  } else if (isTeleporting) {
    return STRENGTH.TELEPORTING;
  } else if (previous.isTeleporting && !isTeleporting) {
    return STRENGTH.TELEPORTED;
  } else {
    return 0;
  }
}

function determineStretchStrength(stretchSystem) {
  if (!stretchSystem.stretcherLeft || !stretchSystem.stretcherRight) {
    return 0;
  }

  return THREE.MathUtils.clamp(
    STRENGTH.STRETCH_BASE +
      STRENGTH.STRETCH_DISTANCE *
        Math.abs(
          distanceBetweenStretchers(stretchSystem.stretcherLeft, stretchSystem.stretcherRight) -
            stretchSystem.initialStretchDistance
        ),
    0,
    0.5
  );
}

export class HapticFeedbackSystem {
  constructor() {
    this.state = {
      rightHand: {
        held: null,
        hovered: null,
        isTeleporting: false
      },
      rightRemote: {
        held: null,
        hovered: null,
        isTeleporting: false
      },
      leftHand: {
        held: null,
        hovered: null,
        isTeleporting: false
      },
      leftRemote: {
        held: null,
        hovered: null,
        isTeleporting: false
      }
    };
  }

  tick(twoPointStretchingSystem, interactLeft, interactRight) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const leftActuator = userinput.get(paths.haptics.actuators.left);
    const rightActuator = userinput.get(paths.haptics.actuators.right);
    if (!leftActuator && !rightActuator) {
      return;
    }

    const interaction = AFRAME.scenes[0].systems.interaction;
    const { leftHand, rightHand, rightRemote, leftRemote } = interaction.state;
    this.leftTeleporter =
      this.leftTeleporter || document.querySelector("#player-left-controller").components.teleporter;
    this.rightTeleporter =
      this.rightTeleporter || document.querySelector("#player-right-controller").components.teleporter;

    const leftHandStrength = determineStrength(this.state.leftHand, leftHand, this.leftTeleporter.isTeleporting);
    const rightHandStrength = determineStrength(this.state.rightHand, rightHand, this.rightTeleporter.isTeleporting);
    const rightRemoteStrength = determineStrength(this.state.rightRemote, rightRemote, false);
    const leftRemoteStrength = determineStrength(this.state.leftRemote, leftRemote, false);
    const buttonLeftStrength = interactLeft ? STRENGTH.BUTTON_PRESSED : 0;
    const buttonRightStrength = interactRight ? STRENGTH.BUTTON_PRESSED : 0;
    const stretchingStrength = determineStretchStrength(twoPointStretchingSystem);

    const leftStrength = Math.max(leftHandStrength, leftRemoteStrength, stretchingStrength, buttonLeftStrength);
    const rightStrength = Math.max(rightHandStrength, rightRemoteStrength, stretchingStrength, buttonRightStrength);

    if (leftStrength && leftActuator) {
      leftActuator.pulse(leftStrength, 15);
    }

    if (rightStrength && rightActuator) {
      rightActuator.pulse(rightStrength, 15);
    }

    copyState(this.state.rightHand, rightHand, this.rightTeleporter.isTeleporting);
    copyState(this.state.leftHand, leftHand, this.leftTeleporter.isTeleporting);
    copyState(this.state.rightRemote, rightRemote, false);
    copyState(this.state.leftRemote, leftRemote, false);
  }
}
