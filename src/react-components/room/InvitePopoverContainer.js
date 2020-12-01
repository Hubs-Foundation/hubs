import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { InvitePopoverButton } from "./InvitePopover";
import { handleExitTo2DInterstitial } from "../../utils/vr-interstitial";

export function InvitePopoverContainer({ hub, scene, ...rest }) {
  // TODO: Move to Hub class
  const shortLink = `https://${configs.SHORTLINK_DOMAIN}/${hub.hub_id}`;
  const embedUrl = `${location.protocol}//${location.host}${location.pathname}?embed_token=${hub.embed_token}`;
  const embedText = `<iframe src="${embedUrl}" style="width: 1024px; height: 768px;" allow="microphone; camera; vr; speaker;"></iframe>`;
  const code = hub.entry_code.toString();
  const popoverApiRef = useRef();

  // Handle clicking on the invite button while in VR.
  useEffect(
    () => {
      function onInviteButtonClicked() {
        handleExitTo2DInterstitial(true, () => {}).then(() => {
          popoverApiRef.current.openPopover();
        });
      }

      scene.addEventListener("action_invite", onInviteButtonClicked);

      return () => {
        scene.removeEventListener("action_invite", onInviteButtonClicked);
      };
    },
    [scene, popoverApiRef]
  );

  return <InvitePopoverButton url={shortLink} code={code} embed={embedText} popoverApiRef={popoverApiRef} {...rest} />;
}

InvitePopoverContainer.propTypes = {
  hub: PropTypes.object,
  scene: PropTypes.object
};
