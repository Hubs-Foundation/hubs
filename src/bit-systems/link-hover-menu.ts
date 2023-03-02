import { defineQuery, enterQuery, entityExists } from "bitecs";
import type { HubsWorld } from "../app";
import { Interacted, Link, LinkHoverMenu, LinkHoverMenuItem, HoveredRemoteRight } from "../bit-components";
import { anyEntityWith } from "../utils/bit-utils";

const NULL_EID = 0;

const hoveredQuery = defineQuery([HoveredRemoteRight, Link]);
const hoveredEnterQuery = enterQuery(hoveredQuery);
const hoveredMenuItemQuery = defineQuery([HoveredRemoteRight, LinkHoverMenuItem]);
const clickedMenuItemQuery = defineQuery([Interacted, LinkHoverMenuItem]);

export function linkHoverMenuSystem(world: HubsWorld) {
  // Assumes always only single LinkHoverMenu entity exists.
  const menuEid = anyEntityWith(world, LinkHoverMenu)!;
  const menuObject = world.eid2obj.get(menuEid)!;

  // Save Link object eid in LinkHoverMenu when hovered.
  hoveredEnterQuery(world).forEach((eid: number) => {
    LinkHoverMenu.targetObject[menuEid] = eid;
    const targetObject = world.eid2obj.get(eid)!;
    targetObject.add(menuObject);
  });

  // Check if the cursor it hovered on Link object or Link menu button object.
  const hovered = hoveredQuery(world).length > 0 || hoveredMenuItemQuery(world).length > 0;

  if (hovered) {
    // Hovered then make the menu visible and handle clicks if needed.
    menuObject.visible = true;
    if (clickedMenuItemQuery(world).length > 0) {
      const linkEid = LinkHoverMenu.targetObject[menuEid];
      if (linkEid !== NULL_EID) {
        // Just in case
        if (entityExists(world, linkEid)) {
          window.open(APP.getString(Link.url[linkEid])!);
        } else {
          // Link object seems to have been already removed so forget it.
          LinkHoverMenu.targetObject[menuEid] = NULL_EID;
        }
      }
    }
  } else {
    // Not hovered then make the menu invisible and forget the Link object.
    menuObject.visible = false;
    if (menuObject.parent !== null) {
      menuObject.parent.remove(menuObject);
    }
    LinkHoverMenu.targetObject[menuEid] = NULL_EID;
  }
}
