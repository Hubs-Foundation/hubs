import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { FileInfo, Pinnable } from "../bit-components";
import { FILE_INFO_FLAGS } from "../inflators/file-info";
import { createEntityState, deleteEntityState } from "./entity-state-utils";
import HubChannel from "./hub-channel";
import { EntityID } from "./networking-types";
import { takeOwnership } from "./take-ownership";
import { getPromotionTokenForFile } from "./media-utils";

export const setPinned = async (hubChannel: HubChannel, world: HubsWorld, eid: EntityID, shouldPin: boolean) => {
  if (!hasComponent(world, Pinnable, eid) || !hasComponent(world, FileInfo, eid)) {
    console.warn("PinningHelper: Attempted pin/unpin on an entity without both Pinnable and FileInfo component", eid);
    return;
  }
  _signInAndPinOrUnpinElement(hubChannel, world, eid, shouldPin);
};

const _pinElement = async (hubChannel: HubChannel, world: HubsWorld, eid: EntityID) => {
  try {
    await createEntityState(hubChannel, world, eid);
    takeOwnership(world, eid);
  } catch (e) {
    if (e.reason === "invalid_token") {
      // TODO: Sign out and sign in again
      // signInAndPinOrUnpinElement(el);
      console.log("PinningHelper: Pin failed due to invalid token, signing out and trying again", e);
    } else {
      console.warn("PinningHelper: Pin failed for unknown reason", e);
    }
  }
};

const unpinElement = (hubChannel: HubChannel, world: HubsWorld, eid: EntityID) => {
  deleteEntityState(hubChannel, world, eid);
};

const _signInAndPinOrUnpinElement = (hubChannel: HubChannel, world: HubsWorld, eid: EntityID, shouldPin: boolean) => {
  const action = shouldPin ? () => _pinElement(hubChannel, world, eid) : () => unpinElement(hubChannel, world, eid);

  // TODO: Perform conditional sign in

  action();
};

export const isPinnable = (world: HubsWorld, eid: EntityID) => {
  const fileId = APP.getString(FileInfo.id[eid]);
  const isPromoted = !!(FileInfo.flags[eid] & FILE_INFO_FLAGS.IS_PERMANENT);
  const isPublic = !fileId;
  const isMine = !!(fileId && getPromotionTokenForFile(fileId));
  return hasComponent(world, Pinnable, eid) && (isPromoted || isPublic || isMine);
};
