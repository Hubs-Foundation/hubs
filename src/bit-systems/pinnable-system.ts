import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Pinnable, Pinned } from "../bit-components";
import { HubsWorld } from "../app";
import { setPinned } from "../utils/bit-pinning-helper";
import HubChannel from "../utils/hub-channel";

const pinnedQuery = defineQuery([Pinnable, Pinned]);
const pinnedEnteryQuery = enterQuery(pinnedQuery);
const pinnedExitQuery = exitQuery(pinnedQuery);

export const pinnableSystem = (world: HubsWorld, hubsChannel: HubChannel) => {
  pinnedEnteryQuery(world).forEach(eid => {
    setPinned(hubsChannel, world, eid, true);
  });

  pinnedExitQuery(world).forEach(eid => {
    setPinned(hubsChannel, world, eid, false);
  });
};
