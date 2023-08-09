import { addComponent } from "bitecs";
import { Link, LinkInitializing } from "../bit-components";
import { HubsWorld } from "../app";

export enum LinkType {
  LINK = 0,
  AVATAR = 1,
  SCENE = 2,
  ROOM = 3,
  ROOM_URL = 4,
  WAYPOINT = 5
}

export type LinkParams = {
  href: string;
  type?: LinkType;
};

export function inflateLink(world: HubsWorld, eid: number, params: LinkParams): number {
  addComponent(world, LinkInitializing, eid);
  addComponent(world, Link, eid);
  Link.url[eid] = APP.getSid(params.href);
  Link.type[eid] = params.type !== undefined ? params.type : LinkType.LINK;
  return eid;
}
