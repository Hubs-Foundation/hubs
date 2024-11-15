import React, { useState } from "react";
import PropTypes from "prop-types";
import styles from "./InvitePopover.scss";
import { CopyableTextInputField } from "../input/CopyableTextInputField";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";
import { Column } from "../layout/Column";
import { InviteLinkInputField } from "./InviteLinkInputField";
import { FormattedMessage, defineMessage, useIntl } from "react-intl";
import { Checkbox, ToolTip } from "@mozilla/lilypad-ui";
import { Button } from "../input/Button";
import isMobile from "../../utils/is-mobile";
import { canShare } from "../../utils/share";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";

function InvitePopoverContent({
  url,
  embed,
  inviteRequired,
  fetchingInvite,
  inviteUrl,
  revokeInvite,
  shareUrlHandler
}) {
  const [isShareInEnglish, setIsShareInEnglish] = useState(false);
  const intl = useIntl();
  return (
    <Column center padding grow gap="lg" className={styles.invitePopover}>
      {inviteRequired ? (
        <>
          {canShare() && (
            <>
              <Button preset="primary" onClick={shareUrlHandler.bind(this, isShareInEnglish)}>
                <ShareIcon />
                <span>
                  <FormattedMessage id="invite-popover.share-invitation" defaultMessage="Share Invitation" />
                </span>
              </Button>
              {!intl?.locale?.startsWith?.("en") && (
                <Checkbox
                  label={<FormattedMessage id="invite-popover.share-in-english" defaultMessage="Share in English" />}
                  checked={isShareInEnglish}
                  onChange={() => setIsShareInEnglish(inEnglish => !inEnglish)}
                />
              )}
            </>
          )}
          <InviteLinkInputField fetchingInvite={fetchingInvite} inviteUrl={inviteUrl} onRevokeInvite={revokeInvite} />
        </>
      ) : (
        <>
          {canShare() && (
            <>
              <Button preset="primary" onClick={shareUrlHandler.bind(this, isShareInEnglish)}>
                <ShareIcon />
                <span>
                  <FormattedMessage id="invite-popover.share-room-link" defaultMessage="Share Room Link" />
                </span>
              </Button>
              {!intl?.locale?.startsWith?.("en") && (
                <Checkbox
                  label={<FormattedMessage id="invite-popover.share-in-english" defaultMessage="Share in English" />}
                  checked={isShareInEnglish}
                  onChange={() => setIsShareInEnglish(inEnglish => !inEnglish)}
                />
              )}
            </>
          )}
          <CopyableTextInputField
            label={<FormattedMessage id="invite-popover.room-link" defaultMessage="Room Link" />}
            value={url}
            buttonPreset="accent3"
          />
          {!isMobile() && embed && (
            <CopyableTextInputField
              label={<FormattedMessage id="invite-popover.embed-code" defaultMessage="Embed Code" />}
              value={embed}
              buttonPreset="accent5"
            />
          )}
        </>
      )}
    </Column>
  );
}

InvitePopoverContent.propTypes = {
  url: PropTypes.string.isRequired,
  embed: PropTypes.string,
  inviteRequired: PropTypes.bool,
  fetchingInvite: PropTypes.bool,
  inviteUrl: PropTypes.string,
  revokeInvite: PropTypes.func
};

const inviteTooltipDescription = defineMessage({
  id: "invite-tooltip.description",
  defaultMessage: "Copy room link to invite others to the room"
});

const invitePopoverTitle = defineMessage({
  id: "invite-popover.title",
  defaultMessage: "Invite"
});

export function InvitePopoverButton({
  url,
  embed,
  initiallyVisible,
  popoverApiRef,
  inviteRequired,
  fetchingInvite,
  inviteUrl,
  revokeInvite,
  shareUrlHandler,
  ...rest
}) {
  const intl = useIntl();
  const title = intl.formatMessage(invitePopoverTitle);
  const description = intl.formatMessage(inviteTooltipDescription);

  return (
    <Popover
      title={title}
      content={() => (
        <InvitePopoverContent
          url={url}
          embed={embed}
          inviteRequired={inviteRequired}
          fetchingInvite={fetchingInvite}
          inviteUrl={inviteUrl}
          revokeInvite={revokeInvite}
          shareUrlHandler={shareUrlHandler}
        />
      )}
      placement="top-start"
      offsetDistance={28}
      initiallyVisible={initiallyVisible}
      popoverApiRef={popoverApiRef}
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolTip description={description}>
          <ToolbarButton
            ref={triggerRef}
            icon={<InviteIcon />}
            selected={popoverVisible}
            onClick={togglePopover}
            label={title}
            {...rest}
          />
        </ToolTip>
      )}
    </Popover>
  );
}

InvitePopoverButton.propTypes = {
  initiallyVisible: PropTypes.bool,
  popoverApiRef: PropTypes.object,
  ...InvitePopoverContent.propTypes
};
