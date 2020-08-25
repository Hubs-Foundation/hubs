import React from "react";
import PropTypes from "prop-types";
import styles from "./InvitePopover.scss";
import { CopyableTextInputField } from "../input/CopyableTextInputField";

export function InvitePopover({ url, code, embed }) {
  return (
    <div className={styles.invitePopover}>
      <CopyableTextInputField label="Room Link" value={url} buttonPreset="green" />
      <CopyableTextInputField label="Room Code" value={code} buttonPreset="blue" />
      <CopyableTextInputField label="Embed Code" value={embed} buttonPreset="purple" />
    </div>
  );
}

InvitePopover.propTypes = {
  url: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  embed: PropTypes.string.isRequired
};
