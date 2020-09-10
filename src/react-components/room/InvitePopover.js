import React from "react";
import PropTypes from "prop-types";
import styles from "./InvitePopover.scss";
import { CopyableTextInputField } from "../input/CopyableTextInputField";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";

function InvitePopoverContent({ url, code, embed }) {
  return (
    <div className={styles.invitePopover}>
      <CopyableTextInputField label="Room Link" value={url} buttonPreset="green" />
      <CopyableTextInputField label="Room Code" value={code} buttonPreset="blue" />
      <CopyableTextInputField label="Embed Code" value={embed} buttonPreset="purple" />
    </div>
  );
}

InvitePopoverContent.propTypes = {
  url: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  embed: PropTypes.string.isRequired
};

export function InvitePopoverButton({ url, code, embed }) {
  return (
    <Popover
      title="Invite"
      content={() => <InvitePopoverContent url={url} code={code} embed={embed} />}
      placement="top"
      offsetDistance={28}
      initiallyVisible
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<InviteIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          label="Invite"
        />
      )}
    </Popover>
  );
}

InvitePopoverButton.propTypes = {
  ...InvitePopoverContent.propTypes
};
