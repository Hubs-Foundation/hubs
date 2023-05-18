import { HubsWorld } from "../app";
import { createEntityState, deleteEntityState } from "./entity-state-utils";
import HubChannel from "./hub-channel";

export const setPinned = async (hubChannel: HubChannel, world: HubsWorld, eid: number, isPinned: boolean) => {
  if (isPinned) {
    createEntityState(hubChannel, world, eid);
  } else {
    deleteEntityState(hubChannel, world, eid);
  }
};

const _signInAndPinOrUnpinElement = () => {};

const _pinElement = async () => {};

const unpinElement = () => {};
