import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { MediaLink } from "../bit-components";

export type MediaLinkParams = {
  src: string;
};

export function inflateMediaLink(world: HubsWorld, eid: EntityID, params: MediaLinkParams) {
  addComponent(world, MediaLink, eid);
  MediaLink.src[eid] = APP.getSid(params.src);
}
