import { HubsWorld } from "../app";
import { createEntityState, deleteEntityState } from "./entity-state-utils";
import HubChannel from "./hub-channel";
import { EntityID } from "./networking-types";
import { takeOwnership } from "./take-ownership";
import { createMessageDatas, isNetworkInstantiated, isPinned } from "../bit-systems/networking";

export const setPinned = async (hubChannel: HubChannel, world: HubsWorld, eid: EntityID, shouldPin: boolean) => {
  _signInAndPinOrUnpinElement(hubChannel, world, eid, shouldPin);
};

const _pinElement = async (hubChannel: HubChannel, world: HubsWorld, eid: EntityID) => {
  try {
    await createEntityState(hubChannel, world, eid);
    takeOwnership(world, eid);
  } catch (e) {
    if (e.reason === "invalid_token") {
      // TODO: Sign out and sign in again
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

export const canPin = (hubChannel: HubChannel, eid: EntityID): boolean => {
  const createMessageData = createMessageDatas.get(eid)!;
  if (createMessageData.prefabName !== "media") {
    return false;
  }
  const fileId = createMessageData.initialData.fileId;
  const hasFile = !!fileId;
  const hasPromotableFile =
    hasFile && APP.store.state.uploadPromotionTokens.some((upload: any) => upload.fileId === fileId);
  return (
    isNetworkInstantiated(eid) &&
    !isPinned(eid) &&
    hubChannel.can("pin_objects") && // TODO: Remove once conditional sign in is implemented
    (!hasFile || hasPromotableFile)
  );
};
