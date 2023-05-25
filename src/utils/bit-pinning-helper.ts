import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { FileInfo, Pinnable } from "../bit-components";
import { FILE_INFO_FLAGS } from "../inflators/file-info";
import { createEntityState, deleteEntityState } from "./entity-state-utils";
import HubChannel from "./hub-channel";
import { EntityID } from "./networking-types";
import { takeOwnership } from "./take-ownership";
import { getPromotionTokenForFile } from "./media-utils";

export const setPinned = async (hubChannel: HubChannel, world: HubsWorld, eid: number, shouldPin: boolean) => {
  if (!hasComponent(world, Pinnable, eid) || !hasComponent(world, FileInfo, eid)) {
    console.warn("PinningHelper: Attempted pin/unpin on an entity without both Pinnable and FileInfo component", eid);
    return;
  }
  _signInAndPinOrUnpinElement(hubChannel, world, eid, shouldPin);
};

const _pinElement = async (hubChannel: HubChannel, world: HubsWorld, eid: number) => {
  const src = APP.getString(FileInfo.src[eid]);
  const fileId = APP.getString(FileInfo.id[eid]);
  let fileAccessToken, promotionToken;
  if (src) {
    fileAccessToken = new URL(src).searchParams.get("token") as string;
    const storedPromotionToken = APP.store.state.uploadPromotionTokens.find(
      (upload: { fileId: string }) => upload.fileId === fileId
    );
    if (storedPromotionToken) {
      promotionToken = storedPromotionToken.promotionToken;
    }
  }

  try {
    await createEntityState(hubChannel, world, eid, fileId!, fileAccessToken, promotionToken);
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

const unpinElement = (hubChannel: HubChannel, world: HubsWorld, eid: number) => {
  deleteEntityState(hubChannel, world, eid);
};

const _signInAndPinOrUnpinElement = (hubChannel: HubChannel, world: HubsWorld, eid: number, shouldPin: boolean) => {
  const action = shouldPin ? () => _pinElement(hubChannel, world, eid) : () => unpinElement(hubChannel, world, eid);

  // TODO: Perform conditional sign in

  action();
};

export const isPinnable = (world: HubsWorld, eid: EntityID) => {
  const fileId = APP.getString(FileInfo.id[eid]);
  const isPromoted = FileInfo.flags[eid] & FILE_INFO_FLAGS.IS_PERMANENT;
  const isPublic = !fileId;
  const isMine = !!(fileId && getPromotionTokenForFile(fileId));
  return hasComponent(world, Pinnable, eid) && (isPromoted || isPublic || isMine);
};
