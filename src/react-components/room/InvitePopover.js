import React from "react";
import PropTypes from "prop-types";
import styles from "./InvitePopover.scss";
import { CopyableTextInputField } from "../input/CopyableTextInputField";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";
import { Column } from "../layout/Column";
import { InviteLinkInputField } from "./InviteLinkInputField";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";

function InvitePopoverContent({ url, code, embed, inviteRequired, fetchingInvite, inviteUrl, revokeInvite }) {
  return (
    <Column center padding grow className={styles.invitePopover}>
      {inviteRequired ? (
        <>
          <InviteLinkInputField fetchingInvite={fetchingInvite} inviteUrl={inviteUrl} onRevokeInvite={revokeInvite} />
        </>
      ) : (
        <>
          <CopyableTextInputField
            label={<FormattedMessage id="invite-popover.room-link" defaultMessage="Room Link" />}
            value={url}
            buttonPreset="green"
          />
          <CopyableTextInputField
            label={<FormattedMessage id="invite-popover.room-code" defaultMessage="Room Code" />}
            value={code}
            buttonPreset="blue"
          />
          <CopyableTextInputField
            label={<FormattedMessage id="invite-popover.embed-code" defaultMessage="Embed Code" />}
            value={embed}
            buttonPreset="purple"
          />
        </>
      )}
    </Column>
  );
}

InvitePopoverContent.propTypes = {
  url: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  embed: PropTypes.string.isRequired,
  inviteRequired: PropTypes.bool,
  fetchingInvite: PropTypes.bool,
  inviteUrl: PropTypes.string,
  revokeInvite: PropTypes.func
};

const invitePopoverTitle = defineMessage({
  id: "invite-popover.title",
  defaultMessage: "Invite"
});

export function InvitePopoverButton({
  url,
  code,
  embed,
  initiallyVisible,
  popoverApiRef,
  inviteRequired,
  fetchingInvite,
  inviteUrl,
  revokeInvite,
  ...rest
}) {
  const intl = useIntl();
  const title = intl.formatMessage(invitePopoverTitle);

  return (
    <Popover
      title={title}
      content={() => (
        <InvitePopoverContent
          url={url}
          code={code}
          embed={embed}
          inviteRequired={inviteRequired}
          fetchingInvite={fetchingInvite}
          inviteUrl={inviteUrl}
          revokeInvite={revokeInvite}
        />
      )}
      placement="top-start"
      offsetDistance={28}
      initiallyVisible={initiallyVisible}
      popoverApiRef={popoverApiRef}
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<InviteIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          label={title}
          {...rest}
        />
      )}
    </Popover>
  );
}

InvitePopoverButton.propTypes = {
  initiallyVisible: PropTypes.bool,
  popoverApiRef: PropTypes.object,
  ...InvitePopoverContent.propTypes
};
