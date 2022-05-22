import { paths } from "./userinput/paths";
import { SOUND_HOVER_OR_GRAB } from "./sound-effects-system";
import { isUI } from "./interactions";
import {
  HeldHandLeft,
  HeldRemoteLeft,
  HeldHandRight,
  HeldRemoteRight,
  HoveredHandLeft,
  HoveredRemoteLeft,
  HoveredHandRight,
  HoveredRemoteRight
} from "../bit-components";
import { anyEntityWith } from "../utils/bit-utils";

export class InteractionSfxSystem {
  constructor() {}

  tick(interaction, userinput, sfx) {
    const state = interaction.state;
    const previousState = interaction.previousState;

    if (
      state.leftHand.held !== previousState.leftHand.held ||
      state.rightHand.held !== previousState.rightHand.held ||
      state.rightRemote.held !== previousState.rightRemote.held ||
      (isUI(state.rightRemote.hovered) && state.rightRemote.hovered !== previousState.rightRemote.hovered) ||
      state.leftRemote.held !== previousState.leftRemote.held ||
      (isUI(state.leftRemote.hovered) && state.leftRemote.hovered !== previousState.leftRemote.hovered)
    ) {
      sfx.playSoundOneShot(SOUND_HOVER_OR_GRAB);
    }

    if (userinput.get(paths.actions.logInteractionState)) {
      console.log(
        "Interaction System State\nleftHand held",
        state.leftHand.held,
        "\nleftHand hovered",
        state.leftHand.hovered,
        "\nrightHand held",
        state.rightHand.held,
        "\nrightHand hovered",
        state.rightHand.hovered,
        "\nrightRemote held",
        state.rightRemote.held,
        "\nrightRemote hovered",
        state.rightRemote.hovered,
        "\nleftRemote held",
        state.leftRemote.held,
        "\nleftRemote hovered",
        state.leftRemote.hovered
      );

      console.log(
        "Interaction System State\nleftHand held",
        anyEntityWith(APP.world, HeldHandLeft),
        "\nleftHand hovered",
        anyEntityWith(APP.world, HoveredHandLeft),
        "\nrightHand held",
        anyEntityWith(APP.world, HeldHandRight),
        "\nrightHand hovered",
        anyEntityWith(APP.world, HoveredHandRight),
        "\nrightRemote held",
        anyEntityWith(APP.world, HeldRemoteRight),
        "\nrightRemote hovered",
        anyEntityWith(APP.world, HoveredRemoteRight),
        "\nleftRemote held",
        anyEntityWith(APP.world, HeldRemoteLeft),
        "\nleftRemote hovered",
        anyEntityWith(APP.world, HoveredRemoteLeft)
      );
    }
  }
}
