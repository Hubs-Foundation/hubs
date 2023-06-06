import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { hubUrl } from "../../utils/phoenix-utils";
import { InvitePopoverButton } from "./InvitePopover";
import { handleExitTo2DInterstitial } from "../../utils/vr-interstitial";
import { useInviteUrl } from "./hooks/useInviteUrl";

export function InvitePopoverContainer({ hub, hubChannel, scene, store, ...rest }) {
  // TODO: Move to Hub class
  const shortUrl = `https://${configs.SHORTLINK_DOMAIN}`;
  const url = `${shortUrl}/${hub.hub_id}`;

  let embedText = null;
  const embedToken = hub.embed_token || store.getEmbedTokenForHub(hub);
  if (embedToken) {
    const embedUrl = hubUrl(hub.hub_id, { embed_token: embedToken });
    embedText = `<iframe src="${embedUrl}" style="width: 1024px; height: 768px;" allow="microphone; camera; vr; speaker;"></iframe>`;
  }

  const popoverApiRef = useRef();

  // Handle clicking on the invite button while in VR.
  useEffect(() => {
    function onInviteButtonClicked() {
      handleExitTo2DInterstitial(true, () => {}).then(() => {
        popoverApiRef.current.openPopover();
      });
    }

    scene.addEventListener("action_invite", onInviteButtonClicked);

    return () => {
      scene.removeEventListener("action_invite", onInviteButtonClicked);
    };
  }, [scene, popoverApiRef]);

  const inviteRequired = hub.entry_mode === "invite";
  const canGenerateInviteUrl = hubChannel.can("update_hub");

  const { fetchingInvite, inviteUrl, revokeInvite } = useInviteUrl(
    hubChannel,
    !inviteRequired || !canGenerateInviteUrl
  );

  if (inviteRequired && !canGenerateInviteUrl) {
    return null;
  }

  return (
    <InvitePopoverButton
      inviteRequired={inviteRequired}
      fetchingInvite={fetchingInvite}
      inviteUrl={inviteUrl}
      revokeInvite={revokeInvite}
      url={url}
      embed={embedText}
      popoverApiRef={popoverApiRef}
      {...rest}
    />
  );
}

InvitePopoverContainer.propTypes = {
  hub: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  hubChannel: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
};
