import { HubsWorld } from "../app";
import { Held, Quack } from "../bit-components";
import { defineQuery, enterQuery } from "bitecs";
import { SOUND_QUACK, SOUND_SPECIAL_QUACK } from "../systems/sound-effects-system";

const heldQuackQuery = defineQuery([Quack, Held]);
const heldQuackEnterQuery = enterQuery(heldQuackQuery);

const quack = (eid: number) => {
  const rand = Math.random();
  if (rand < Quack.specialQuackPercentage[eid]) {
    AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
  } else if (rand < Quack.quackPercentage[eid]) {
    AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
  }
};

export function quackSystem(world: HubsWorld) {
  heldQuackEnterQuery(world).forEach((eid: number) => quack(eid));
}
