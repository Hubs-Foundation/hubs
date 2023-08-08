import { defineQuery, enterQuery, exitQuery } from "bitecs";
import type { HubsWorld } from "../app";
import { Link } from "../bit-components";
import { isHubsRoomUrl, isLocalHubsAvatarUrl, isLocalHubsSceneUrl, isLocalHubsUrl } from "../utils/media-url-utils";
import { LinkType } from "../inflators/link";
import { JobRunner } from "../utils/coroutine-utils";
import { EntityID } from "../utils/networking-types";

const linkQuery = defineQuery([Link]);
const linkEnterQuery = enterQuery(linkQuery);
const linkExitQuery = exitQuery(linkQuery);

function* updateLinkType(world: HubsWorld, eid: EntityID) {
  const mayChangeScene = (APP.scene?.systems as any).permissions.canOrWillIfCreator("update_hub");
  const src = APP.getString(Link.url[eid])!;
  let hubId;
  if ((yield isLocalHubsAvatarUrl(src)) as boolean) {
    Link.type[eid] = LinkType.AVATAR;
  } else if (((yield isLocalHubsSceneUrl(src)) as boolean) && mayChangeScene) {
    Link.type[eid] = LinkType.SCENE;
  } else if ((hubId = (yield isHubsRoomUrl(src)) as string)) {
    const url = new URL(src);
    if (url.hash && APP.hub!.hub_id === hubId) {
      Link.type[eid] = LinkType.WAYPOINT;
    } else if ((yield isLocalHubsUrl(src)) as boolean) {
      Link.type[eid] = LinkType.ROOM;
    } else {
      Link.type[eid] = LinkType.ROOM_URL;
    }
  }
}

const jobs = new JobRunner();
export function linkSystem(world: HubsWorld) {
  linkEnterQuery(world).forEach(eid => {
    jobs.stop(eid);
    jobs.add(eid, () => updateLinkType(world, eid));
  });
  linkExitQuery(world).forEach(eid => {
    jobs.stop(eid);
  });
  jobs.tick();
}
