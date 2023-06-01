import { defineQuery, enterQuery, entityExists } from "bitecs";
import type { HubsWorld } from "../app";
import { Interacted, Link, LinkHoverMenu, LinkHoverMenuItem, HoveredRemoteRight, TextTag } from "../bit-components";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { isHubsRoomUrl, isLocalHubsAvatarUrl, isLocalHubsSceneUrl, isLocalHubsUrl } from "../utils/media-url-utils";
import { Text as TroikaText } from "troika-three-text";
import { handleExitTo2DInterstitial } from "../utils/vr-interstitial";
import { changeHub } from "../change-hub";

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
  hoveredEnterQuery(world).forEach(async (eid: number) => {
    LinkHoverMenu.targetObjectRef[menuEid] = eid;
    const targetObject = world.eid2obj.get(eid)!;
    targetObject.add(menuObject);

    const buttonRef = LinkHoverMenu.linkButtonRef[menuEid];
    let text = findChildWithComponent(world, TextTag, buttonRef)!;
    let textObj = world.eid2obj.get(text)! as TroikaText;
    const mayChangeScene = (APP.scene?.systems as any).permissions.canOrWillIfCreator("update_hub");
    const src = APP.getString(Link.url[eid])!;
    let hubId;
    let label = "open link";
    if (await isLocalHubsAvatarUrl(src)) {
      label = "use avatar";
    } else if ((await isLocalHubsSceneUrl(src)) && mayChangeScene) {
      label = "use scene";
    } else if ((hubId = await isHubsRoomUrl(src))) {
      const url = new URL(src);
      if (url.hash && APP.hub!.hub_id === hubId) {
        label = "go to";
      } else {
        label = "visit room";
      }
    }
    textObj.text = label;
  });

  // Check if the cursor it hovered on Link object or Link menu button object.
  const hovered = hoveredQuery(world).length > 0 || hoveredMenuItemQuery(world).length > 0;

  const linkEid = LinkHoverMenu.targetObjectRef[menuEid];
  if (hovered && entityExists(world, linkEid)) {
    // Hovered then make the menu visible and handle clicks if needed.
    menuObject.visible = true;
    clickedMenuItemQuery(world).forEach(async eid => {
      const linkEid = LinkHoverMenu.targetObjectRef[menuEid];
      const src = APP.getString(Link.url[linkEid])!;
      const exitImmersive = async () => await handleExitTo2DInterstitial(false, () => {}, true);

      const mayChangeScene = (APP.scene?.systems as any).permissions.canOrWillIfCreator("update_hub");
      let hubId;
      if (await isLocalHubsAvatarUrl(src)) {
        const avatarId = new URL(src).pathname.split("/").pop();
        window.APP.store.update({ profile: { avatarId } });
        APP.scene!.emit("avatar_updated");
      } else if ((await isLocalHubsSceneUrl(src)) && mayChangeScene) {
        APP.scene!.emit("scene_media_selected", src);
      } else if ((hubId = await isHubsRoomUrl(src))) {
        const url = new URL(src);
        if (url.hash && APP.hub!.hub_id === hubId) {
          // move to waypoint w/o writing to history
          window.history.replaceState(null, "", window.location.href.split("#")[0] + url.hash);
        } else if (await isLocalHubsUrl(src)) {
          const waypoint = url.hash && url.hash.substring(1);
          // move to new room without page load or entry flow
          changeHub(hubId, true, waypoint);
        } else {
          await exitImmersive();
          location.href = src;
        }
      } else {
        await exitImmersive();
        window.open(src);
      }
    });
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
