import { addComponent } from "bitecs";
import { Link } from "../bit-components";
import { HubsWorld } from "../app";

export type LinkParams = {
  href: string;
};

export function inflateLink(world: HubsWorld, eid: number, params: LinkParams): number {
  addComponent(world, Link, eid);
  Link.url[eid] = APP.getSid(params.href);
  return eid;
}
