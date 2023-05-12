import { HubsWorld } from "../app";
import { Held, Quack } from "../bit-components";
import { defineQuery, enterQuery } from "bitecs";
import { SOUND_QUACK, SOUND_SPECIAL_QUACK } from "../systems/sound-effects-system";

const heldQuackQuery = defineQuery([Quack, Held]);
const heldQuackEnterQuery = enterQuery(heldQuackQuery);

export function quackSystem(world: HubsWorld) {
  heldQuackEnterQuery(world).forEach(() => {
    const rand = Math.random();
    if (rand < 0.01) {
      APP.scene?.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
    } else {
      APP.scene?.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
    }
  });
}
