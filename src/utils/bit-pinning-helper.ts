import { getEntityComponents, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaImage, MediaLoaded, MediaLoader, Networked } from "../bit-components";
import { createEntityState, deleteEntityState } from "./entity-state-utils";
import HubChannel from "./hub-channel";
import { takeOwnership } from "./take-ownership";
import { findAncestorWithComponent, findChildWithComponent } from "./bit-utils";

export const setPinned = async (hubChannel: HubChannel, world: HubsWorld, eid: number, shouldPin: boolean) => {
  _signInAndPinOrUnpinElement(eid, shouldPin);
};

const _pinElement = async (eid: number) => {
  // createEntityState(APP.hubChannel!, APP.world, eid);

  const nid = Networked.id[eid];
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
    await createEntityState(APP.hubChannel!, APP.world, eid);
    // If we lost ownership of the entity while waiting for the pin to go through,
    // try to regain ownership before setting the "pinned" state.
    // if (!NAF.utils.isMine(el)) {
    //   takeOwnership(APP.world, eid);
    //   console.warn("PinningHelper: Pinning succeeded, but ownership was lost in the mean time");
    // }
  } catch (e) {
    if (e.reason === "invalid_token") {
      // await this.authChannel.signOut(this.hubChannel);
      // this._signInAndPinOrUnpinElement(el);
      console.log("PinningHelper: Pin failed due to invalid token, signing out and trying again", e);
    } else {
      console.warn("PinningHelper: Pin failed for unknown reason", e);
    }
  }
};

const unpinElement = (eid: number) => {
  deleteEntityState(APP.hubChannel!, APP.world, eid);
};

const _signInAndPinOrUnpinElement = (eid: number, shouldPin: boolean) => {
  const action = shouldPin ? () => _pinElement(eid) : () => unpinElement(eid);

  // performConditionalSign(
  //   () => this.hubChannel.signedIn,
  //   action,
  //   shouldPin ? SignInMessages.pin : SignInMessages.unpin,
  //   e => {
  //     console.warn(`PinningHelper: Conditional sign-in failed. ${e}`);
  //   }
  // );
  action();
};
