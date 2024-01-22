import { Not, addComponent, defineQuery, entityExists, removeComponent } from "bitecs";
import type { HubsWorld } from "../app";
import {
  Link,
  LinkHoverMenu,
  HoveredRemoteRight,
  TextTag,
  Interacted,
  LinkHoverMenuItem,
  LinkInitializing,
  ObjectMenuTransform,
  CursorRaycastable
} from "../bit-components";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { hubIdFromUrl } from "../utils/media-url-utils";
import { Text as TroikaText } from "troika-three-text";
import { handleExitTo2DInterstitial } from "../utils/vr-interstitial";
import { changeHub } from "../change-hub";
import { EntityID } from "../utils/networking-types";
import { LinkType } from "../inflators/link";
import { ObjectMenuTransformFlags } from "../inflators/object-menu-transform";

const menuQuery = defineQuery([LinkHoverMenu]);
const hoveredLinksQuery = defineQuery([HoveredRemoteRight, Link, Not(LinkInitializing)]);
const hoveredMenuItemQuery = defineQuery([HoveredRemoteRight, LinkHoverMenuItem]);
const clickedMenuItemQuery = defineQuery([Interacted, LinkHoverMenuItem]);

function setCursorRaycastable(world: HubsWorld, menu: EntityID, enable: boolean) {
  let change = enable ? addComponent : removeComponent;
  change(world, CursorRaycastable, menu);
  change(world, CursorRaycastable, LinkHoverMenu.linkButtonRef[menu]);
}

function updateLinkMenuTarget(world: HubsWorld, menu: EntityID, sceneIsFrozen: boolean) {
  if (LinkHoverMenu.targetObjectRef[menu] && !entityExists(world, LinkHoverMenu.targetObjectRef[menu])) {
    // Clear the invalid entity reference. (The link entity was removed).
    LinkHoverMenu.targetObjectRef[menu] = 0;
  }

  if (sceneIsFrozen) {
    LinkHoverMenu.targetObjectRef[menu] = 0;
  }

  const hoveredLink = hoveredLinksQuery(world);
  if (hoveredLink.length > 0) {
    LinkHoverMenu.targetObjectRef[menu] = hoveredLink[0];
    LinkHoverMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
  }

  const hoveredMenuItem = hoveredMenuItemQuery(world);
  if (hoveredMenuItem.length > 0) {
    LinkHoverMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
  }

  if (world.time.elapsed > LinkHoverMenu.clearTargetTimer[menu]) {
    LinkHoverMenu.targetObjectRef[menu] = 0;
  }
}

// TODO: Move this to coroutines
async function handleLinkClick(world: HubsWorld, button: EntityID) {
  const exitImmersive = async () => await handleExitTo2DInterstitial(false, () => {}, true);

  const menu = findAncestorWithComponent(world, LinkHoverMenu, button)!;
  const linkEid = LinkHoverMenu.targetObjectRef[menu];
  const src = APP.getString(Link.url[linkEid])!;
  if (!src) return;
  const url = new URL(src);
  const linkType = Link.type[linkEid];
  switch (linkType) {
    case LinkType.LINK:
      await exitImmersive();
      window.open(src);
      break;
    case LinkType.AVATAR:
      const avatarId = url.pathname.split("/").pop();
      window.APP.store.update({ profile: { avatarId } });
      APP.scene!.emit("avatar_updated");
      break;
    case LinkType.SCENE:
      APP.scene!.emit("scene_media_selected", src);
      break;
    case LinkType.WAYPOINT:
      // move to waypoint w/o writing to history
      window.history.replaceState(null, "", window.location.href.split("#")[0] + url.hash);
      break;
    case LinkType.ROOM:
      const waypoint = url.hash && url.hash.substring(1);
      // move to new room without page load or entry flow
      const hubId = hubIdFromUrl(src);
      changeHub(hubId, true, waypoint);
      break;
    case LinkType.ROOM_URL:
      await exitImmersive();
      location.href = src;
      break;
  }
}

function updateButtonText(world: HubsWorld, menu: EntityID, button: EntityID) {
  const text = findChildWithComponent(world, TextTag, button)!;
  const textObj = world.eid2obj.get(text)! as TroikaText;
  const linkEid = LinkHoverMenu.targetObjectRef[menu];
  const linkType = Link.type[linkEid];
  let label = "";
  switch (linkType) {
    case LinkType.LINK:
      label = "open link";
      break;
    case LinkType.AVATAR:
      label = "use avatar";
      break;
    case LinkType.SCENE:
      label = "use scene";
      break;
    case LinkType.WAYPOINT:
      label = "go to";
      break;
    case LinkType.ROOM:
    case LinkType.ROOM_URL:
      label = "visit room";
      break;
  }
  textObj.text = label;
}

function flushToObject3Ds(world: HubsWorld, menu: EntityID, frozen: boolean, force: boolean) {
  const target = LinkHoverMenu.targetObjectRef[menu];
  const visible = !!target && !frozen;

  // TODO We are handling menus visibility in a similar way for all the object menus, we
  // should probably refactor this to a common object-menu-visibility-system
  if (visible) {
    ObjectMenuTransform.targetObjectRef[menu] = target;
    ObjectMenuTransform.flags[menu] |= ObjectMenuTransformFlags.Enabled;
  } else {
    ObjectMenuTransform.flags[menu] &= ~ObjectMenuTransformFlags.Enabled;
  }

  const obj = world.eid2obj.get(menu)!;
  obj.visible = visible;

  const linkButtonRef = LinkHoverMenu.linkButtonRef[menu];
  const buttonObj = world.eid2obj.get(linkButtonRef)!;
  // Parent visibility doesn't block raycasting, so we must set each button to be invisible
  // TODO: Ensure that children of invisible entities aren't raycastable
  if (visible) {
    if (visible !== buttonObj.visible || force) {
      updateButtonText(world, menu, linkButtonRef);
      buttonObj.visible = true;
    }
  } else {
    buttonObj.visible = false;
  }

  setCursorRaycastable(world, menu, visible);
}

export function linkHoverMenuSystem(world: HubsWorld, sceneIsFrozen: boolean) {
  // Assumes always only single LinkHoverMenu entity exists for now.
  // TODO: Take into account for more than one for VR
  menuQuery(world).forEach(menu => {
    const prevTarget = LinkHoverMenu.targetObjectRef[menu];
    updateLinkMenuTarget(world, menu, sceneIsFrozen);
    const currTarget = LinkHoverMenu.targetObjectRef[menu];
    if (currTarget) {
      clickedMenuItemQuery(world).forEach(eid => handleLinkClick(world, eid));
    }
    flushToObject3Ds(world, menu, sceneIsFrozen, prevTarget !== currTarget);
  });
}
