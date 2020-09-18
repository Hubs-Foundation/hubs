import React from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { InvitePopoverButton } from "./InvitePopover";

export function InvitePopoverContainer({ hub, ...rest }) {
  // TODO: Move to Hub class
  const shortLink = `https://${configs.SHORTLINK_DOMAIN}/${hub.hub_id}`;
  const embedUrl = `${location.protocol}//${location.host}${location.pathname}?embed_token=${hub.embed_token}`;
  const embedText = `<iframe src="${embedUrl}" style="width: 1024px; height: 768px;" allow="microphone; camera; vr; speaker;"></iframe>`;

  return <InvitePopoverButton url={shortLink} code={hub.entry_code} embed={embedText} {...rest} />;
}

InvitePopoverContainer.propTypes = {
  hub: PropTypes.object
};
