import { AElement } from "aframe";
import { defineQuery, hasComponent, removeEntity } from "bitecs";
import { HubsWorld } from "../app";
import { EntityProxy, Networked, Rigidbody, RoomPortal } from "../bit-components";
import { changeHub } from "../change-hub";
import { PhysicsSystem } from "../systems/physics-system";
import { sleep } from "../utils/async-utils";
import HubChannel from "../utils/hub-channel";
import { isHubsRoomUrl } from "../utils/media-url-utils";
import { EntityID } from "../utils/networking-types";

function isColliding(world: HubsWorld, eidA: EntityID, eidB: EntityID) {
  // TODO physics system init is async so these don't get created right away.. They probably can be
  if (!hasComponent(world, Rigidbody, eidA)) return;
  if (!hasComponent(world, Rigidbody, eidB)) return;

  const physicsSystem: PhysicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eidA]);
  if (!collisions) return false;

  for (let i = 0; i < collisions.length; i++) {
    const data = physicsSystem.bodyUuidToData.get(collisions[i]);
    if (data && data.object3D && data.object3D.eid === eidB) {
      return true;
    }
  }

  return false;
}

async function travelViaPortal(roomPortalEid: EntityID) {
  isTraveling = true;
  try {
    const src = APP.getString(RoomPortal.src[roomPortalEid])!;
    let hubId = await isHubsRoomUrl(src);

    if (!hubId) {
      const url = new URL(src);
      hubId = url.searchParams.get("hub_id");
    }

    // const waypoint = url.hash && url.hash.substring(1);
    await changeHub(hubId, true, null);
    await sleep(2000);
  } catch (e) {
    console.error(e);
  }
  isTraveling = false;
}

const roomPortalQuery = defineQuery([RoomPortal]);
let avatarPovNode: EntityID | undefined;
let isTraveling = false;
let showPortals = true;
export function setPortalVisibility(show: boolean) {
  showPortals = show;
}

let deleteNextPortal = false;
export function queueDeleteNextPortal() {
  deleteNextPortal = true;
}

function deleteRoomPortal(world: HubsWorld, hubChannel: HubChannel, roomPortalEid: EntityID) {
  if (hasComponent(world, EntityProxy, roomPortalEid)) {
    const el = (EntityProxy.map as any).get(roomPortalEid)!;
    const networkedId = el.className;
    hubChannel.unpin(networkedId, null);
    el.parentNode.removeChild(el);
  }

  const networkedId = APP.getString(Networked.id[roomPortalEid])!;
  hubChannel.unpin(networkedId, null);
  removeEntity(world, roomPortalEid);
}

export function roomPortalSystem(world: HubsWorld) {
  if (!avatarPovNode) {
    const el = document.querySelector("#avatar-pov-node") as AElement;
    avatarPovNode = el && el.object3D && el.object3D.eid;
  }
  if (!avatarPovNode) return;

  roomPortalQuery(world).forEach(roomPortalEid => {
    const obj = world.eid2obj.get(roomPortalEid)!;
    if (showPortals !== obj.visible) {
      obj.visible = !obj.visible;
    }

    if (isColliding(world, avatarPovNode!, roomPortalEid)) {
      if (deleteNextPortal) {
        deleteRoomPortal(world, APP.hubChannel!, roomPortalEid);
        deleteNextPortal = false;
      } else if (!isTraveling) {
        travelViaPortal(roomPortalEid);
      }
    }
  });
}
