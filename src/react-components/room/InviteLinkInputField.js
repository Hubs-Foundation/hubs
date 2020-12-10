import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./RoomSettingsSidebar.scss";
import { IconButton } from "../input/IconButton";
import { FormattedMessage } from "react-intl";
import { CopyableTextInputField } from "../input/CopyableTextInputField";

export function InviteLinkInputField({ fetchingInvite, inviteUrl, onRevokeInvite }) {
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false);

  const revokeInvite = useCallback(() => {
    setShowRevokeConfirmation(true);
  }, []);

  const cancelConfirmRevokeInvite = useCallback(() => {
    setShowRevokeConfirmation(false);
  }, []);

  const confirmRevokeInvite = useCallback(
    () => {
      onRevokeInvite();
      setShowRevokeConfirmation(false);
    },
    [onRevokeInvite]
  );

  return (
    <CopyableTextInputField
      label="Invite link"
      disabled={fetchingInvite}
      value={fetchingInvite ? "Generating invite..." : inviteUrl}
      buttonPreset="blue"
      description={
        !fetchingInvite &&
        (showRevokeConfirmation ? (
          <>
            <FormattedMessage id="room-settings.revoke-confirm" />{" "}
            <IconButton className={styles.confirmRevokeButton} onClick={confirmRevokeInvite}>
              <FormattedMessage id="room-settings.revoke-confirm-yes" />
            </IconButton>{" "}
            /{" "}
            <IconButton className={styles.confirmRevokeButton} onClick={cancelConfirmRevokeInvite}>
              <FormattedMessage id="room-settings.revoke-confirm-no" />
            </IconButton>
          </>
        ) : (
          <IconButton className={styles.confirmRevokeButton} onClick={revokeInvite}>
            <FormattedMessage id="room-settings.revoke" />
          </IconButton>
        ))
      }
      fullWidth
    />
  );
}

InviteLinkInputField.propTypes = {
  fetchingInvite: PropTypes.bool,
  inviteUrl: PropTypes.string,
  onRevokeInvite: PropTypes.func.isRequired
};
