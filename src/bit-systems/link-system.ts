import { defineQuery, enterQuery } from "bitecs";
import type { HubsWorld } from "../app";
import { Link } from "../bit-components";
import { isHubsRoomUrl, isLocalHubsAvatarUrl, isLocalHubsSceneUrl, isLocalHubsUrl } from "../utils/media-url-utils";
import { LinkType } from "../inflators/link";

const linkQuery = defineQuery([Link]);
const linkEnterQuery = enterQuery(linkQuery);

export function linkSystem(world: HubsWorld) {
  linkEnterQuery(world).forEach(async eid => {
    const mayChangeScene = (APP.scene?.systems as any).permissions.canOrWillIfCreator("update_hub");
    const src = APP.getString(Link.url[eid])!;
    let hubId;
    if (await isLocalHubsAvatarUrl(src)) {
      Link.type[eid] = LinkType.AVATAR;
    } else if ((await isLocalHubsSceneUrl(src)) && mayChangeScene) {
      Link.type[eid] = LinkType.SCENE;
    } else if ((hubId = await isHubsRoomUrl(src))) {
      const url = new URL(src);
      if (url.hash && APP.hub!.hub_id === hubId) {
        Link.type[eid] = LinkType.WAYPOINT;
      } else if (await isLocalHubsUrl(this.src)) {
        Link.type[eid] = LinkType.LOCAL_ROOM;
      } else {
        Link.type[eid] = LinkType.EXTERNAL_ROOM;
      }
    }
  });
}
