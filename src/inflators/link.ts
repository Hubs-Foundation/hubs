import { addComponent } from "bitecs";
import { CursorRaycastable, Link, RemoteHoverTarget } from "../bit-components";
import { HubsWorld } from "../app";

export type LinkParams = {
  href: string;
};

export function inflateLink(world: HubsWorld, eid: number, params: LinkParams): number {
  addComponent(world, Link, eid);
  addComponent(world, RemoteHoverTarget, eid);
  addComponent(world, CursorRaycastable, eid);
  Link.url[eid] = APP.getSid(params.href);
  return eid;
}
