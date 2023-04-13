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
  // Assumes always only single LinkHoverMenu entity exists for now.
  // TODO: Take into account for more than one for VR
  const menuEid = anyEntityWith(world, LinkHoverMenu)!;
  const menuObject = world.eid2obj.get(menuEid)!;

  // Save Link object eid in LinkHoverMenu when hovered.
  hoveredEnterQuery(world).forEach((eid: number) => {
    LinkHoverMenu.targetObjectRef[menuEid] = eid;
    const targetObject = world.eid2obj.get(eid)!;
    targetObject.add(menuObject);
  });

  // Check if the cursor it hovered on Link object or Link menu button object.
  const hovered = hoveredQuery(world).length > 0 || hoveredMenuItemQuery(world).length > 0;

  const linkEid = LinkHoverMenu.targetObjectRef[menuEid];
  if (hovered && entityExists(world, linkEid)) {
    // Hovered then make the menu visible and handle clicks if needed.
    menuObject.visible = true;
    if (clickedMenuItemQuery(world).length > 0) {
      // TODO: Change the action and label depending on 
      //       target (eg: switching avatars for avatar url)
      window.open(APP.getString(Link.url[linkEid])!);
    }
  } else {
    // Not hovered or target object has already been deleted
    // then make the menu invisible and forget the Link object.
    menuObject.visible = false;
    if (menuObject.parent !== null) {
      menuObject.parent.remove(menuObject);
    }
    LinkHoverMenu.targetObjectRef[menuEid] = NULL_EID;
  }
}
