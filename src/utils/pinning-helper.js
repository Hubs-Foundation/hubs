import pinnedEntityToGltf from "./pinned-entity-to-gltf";
import { getPromotionTokenForFile } from "./media-utils";
import { SignInMessages } from "../react-components/auth/SignInModal";

export default class PinningHelper {
  constructor(hubChannel, authChannel, store, performConditionalSignIn) {
    this.hubChannel = hubChannel;
    this.authChannel = authChannel;
    this.store = store;
    this.performConditionalSignIn = performConditionalSignIn;
  }

  async setPinned(el, pin) {
    if (NAF.utils.isMine(el)) {
      this._signInAndPinOrUnpinElement(el, pin);
    } else {
      console.warn("PinningHelper: Attempted to set pin state on object that was not mine.");
    }
  }

  _signInAndPinOrUnpinElement = (el, pin) => {
    const action = pin ? () => this._pinElement(el) : () => this.unpinElement(el);

    this.performConditionalSignIn(
      () => this.hubChannel.signedIn,
      action,
      pin ? SignInMessages.pin : SignInMessages.unpin,
      e => {
        console.warn(`PinningHelper: Conditional sign-in failed. ${e}`);
      }
    );
  };

  async _pinElement(el) {
    const { networkId } = el.components.networked.data;

    const { fileId, src } = el.components["media-loader"].data;
    let fileAccessToken, promotionToken;
    if (fileId) {
      fileAccessToken = new URL(src).searchParams.get("token");
      const storedPromotionToken = getPromotionTokenForFile(fileId);
      if (storedPromotionToken) {
        promotionToken = storedPromotionToken.promotionToken;
      }
    }

    const gltfNode = pinnedEntityToGltf(el);
    if (!gltfNode) {
      console.warn("PinningHelper: Entity did not produce a GLTF node.");
      return;
    }
    el.setAttribute("networked", { persistent: true });
    el.setAttribute("media-loader", { fileIsOwned: true });

    try {
      await this.hubChannel.pin(networkId, gltfNode, fileId, fileAccessToken, promotionToken);

      // If we lost ownership of the entity while waiting for the pin to go through,
      // try to regain ownership before setting the "pinned" state.
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) {
        console.warn("PinningHelper: Pinning succeeded, but ownership was lost in the mean time");
      }

      el.setAttribute("pinnable", "pinned", true);
      el.emit("pinned", { el });
      this.store.update({ activity: { hasPinned: true } });
    } catch (e) {
      if (e.reason === "invalid_token") {
        await this.authChannel.signOut(this.hubChannel);
        this._signInAndPinOrUnpinElement(el);
      } else {
        console.warn("PinningHelper: Pin failed for unknown reason", e);
      }
    }
  }

  unpinElement(el) {
    const components = el.components;
    const networked = components.networked;

    if (!networked || !networked.data || !NAF.utils.isMine(el)) {
      console.warn("PinningHelper: Tried to unpin element that is not networked or not mine.");
      return;
    }

    const networkId = components.networked.data.networkId;
    el.setAttribute("networked", { persistent: false });

    const mediaLoader = components["media-loader"];
    const fileId = mediaLoader.data && mediaLoader.data.fileId;

    this.hubChannel.unpin(networkId, fileId);
    el.setAttribute("pinnable", "pinned", false);
    el.emit("unpinned", { el });
  }
}
