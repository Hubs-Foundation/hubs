import { defineQuery, enterQuery } from "bitecs";
import { HubsWorld } from "../app";
import {
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  HoldableButton,
  HoverButton,
  HoveredHandLeft,
  HoveredHandRight,
  HoveredRemoteLeft,
  HoveredRemoteRight
} from "../bit-components";
import { SOUND_HOVER_OR_GRAB } from "../systems/sound-effects-system";

const hoveredRemoteRightQuery = defineQuery([HoverButton, HoveredRemoteRight]);
const hoveredRemoteRightEnterQuery = enterQuery(hoveredRemoteRightQuery);
const hoveredRemoteLeftQuery = defineQuery([HoverButton, HoveredRemoteLeft]);
const hoveredRemoteLeftEnterQuery = enterQuery(hoveredRemoteLeftQuery);
const hoveredHandRightQuery = defineQuery([HoverButton, HoveredHandRight]);
const hoveredHandRightEnterQuery = enterQuery(hoveredHandRightQuery);
const hoveredHandLeftQuery = defineQuery([HoverButton, HoveredHandLeft]);
const hoveredHandLeftEnterQuery = enterQuery(hoveredHandLeftQuery);
const heldRemoteRightQuery = defineQuery([HoldableButton, HeldRemoteRight]);
const heldRemoteRightEnterQuery = enterQuery(heldRemoteRightQuery);
const heldRemoteLeftQuery = defineQuery([HoldableButton, HeldRemoteLeft]);
const heldRemoteLeftEnterQuery = enterQuery(heldRemoteLeftQuery);
const heldHandRightQuery = defineQuery([HoldableButton, HeldHandRight]);
const heldHandRightEnterQuery = enterQuery(heldHandRightQuery);
const heldHandLeftQuery = defineQuery([HoldableButton, HeldHandLeft]);
const heldHandLeftEnterQuery = enterQuery(heldHandLeftQuery);
export function sfxButtonSystem(world: HubsWorld, sfxSystem: any) {
  hoveredRemoteRightEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  hoveredRemoteLeftEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  hoveredHandRightEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  hoveredHandLeftEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  heldRemoteRightEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  heldRemoteLeftEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  heldHandRightEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
  heldHandLeftEnterQuery(world).forEach(() => sfxSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB));
}
