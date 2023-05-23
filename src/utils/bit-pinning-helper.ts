import { HubsWorld } from "../app";
import { MediaLoaded } from "../bit-components";
import { createEntityState, deleteEntityState } from "./entity-state-utils";
import HubChannel from "./hub-channel";
import { takeOwnership } from "./take-ownership";

export const setPinned = async (hubChannel: HubChannel, world: HubsWorld, eid: number, shouldPin: boolean) => {
  _signInAndPinOrUnpinElement(hubChannel, world, eid, shouldPin);
};

const _pinElement = async (hubChannel: HubChannel, world: HubsWorld, eid: number) => {
  const src = APP.getString(MediaLoaded.src[eid]);
  const fileId = APP.getString(MediaLoaded.fileId[eid]);
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
