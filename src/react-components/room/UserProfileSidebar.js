import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { BackButton } from "../input/BackButton";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import styles from "./UserProfileSidebar.scss";
import { FormattedMessage, useIntl } from "react-intl";
import { Slider } from "../input/Slider";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as VolumeHigh } from "../icons/VolumeHigh.svg";
import { ReactComponent as VolumeMuted } from "../icons/VolumeMuted.svg";
import useAvatarVolume from "./useAvatarVolume";
import { calcLevel, calcGainMultiplier, MAX_VOLUME_LABELS } from "../../utils/avatar-volume-utils";

const MIN = 0;
const MAX = MAX_VOLUME_LABELS - 1;

export function UserProfileSidebar({
  className,
  userId,
  displayName,
  identityName,
  avatarPreview,
  hasMicPresence,
  isSignedIn,
  canPromote,
  onPromote,
  canDemote,
  onDemote,
  isHidden,
  onToggleHidden,
  canMute,
  isNetworkMuted,
  onMute,
  canKick,
  onKick,
  showBackButton,
  onBack,
  onClose,
  ...rest
}) {
  const intl = useIntl();
  const [multiplier, updateMultiplier, isMuted, updateMuted] = useAvatarVolume(userId);
  const onLevelChanged = useCallback(
    level => {
      updateMultiplier(calcGainMultiplier(level));
    },
    [updateMultiplier]
  );
  const newLevel = calcLevel(multiplier);
  return (
    <Sidebar
      title={identityName ? `${displayName} (${identityName})` : displayName}
      beforeTitle={showBackButton ? <BackButton onClick={onBack} /> : <CloseButton onClick={onClose} />}
      className={className}
      {...rest}
    >
      <Column center padding>
        <div className={styles.avatarPreviewContainer}>{avatarPreview || <div />}</div>
        {hasMicPresence && (
          <div className={styles.sliderContainer}>
            <ToolbarButton
              icon={isNetworkMuted || isMuted ? <VolumeMuted /> : <VolumeHigh />}
              selected={isNetworkMuted || isMuted}
              preset="accent4"
              style={{ display: "block" }}
              onClick={() => {
                updateMuted(!isMuted);
              }}
              disabled={isNetworkMuted}
            />
            <Slider
              min={MIN}
              max={MAX}
              step={1}
              value={newLevel}
              onChange={onLevelChanged}
              className={styles.sliderInputContainer}
              disabled={isNetworkMuted || isMuted}
            />
          </div>
        )}
        {canPromote && (
          <Button
            preset="accept"
            disabled={!isSignedIn}
            title={
              isSignedIn
                ? intl.formatMessage({ id: "user-profile-sidebar.promote-button", defaultMessage: "Promote" })
                : intl.formatMessage(
                    {
                      id: "user-profile-sidebar.promote-button-disabled-label",
                      defaultMessage: "{displayName} is signed out."
                    },
                    { displayName }
                  )
            }
            onClick={onPromote}
          >
            <FormattedMessage id="user-profile-sidebar.promote-button" defaultMessage="Promote" />
          </Button>
        )}
        {canDemote && (
          <Button
            preset="cancel"
            disabled={!isSignedIn}
            title={
              isSignedIn
                ? intl.formatMessage({ id: "user-profile-sidebar.demote-button", defaultMessage: "Demote" })
                : intl.formatMessage(
                    {
                      id: "user-profile-sidebar.demote-button-disabled-label",
                      defaultMessage: "{displayName} is signed out."
                    },
                    { displayName }
                  )
            }
            onClick={onDemote}
          >
            <FormattedMessage id="user-profile-sidebar.demote-button" defaultMessage="Demote" />
          </Button>
        )}
        <Button onClick={onToggleHidden}>
          {isHidden ? (
            <FormattedMessage id="user-profile-sidebar.unhide-button" defaultMessage="Unhide" />
          ) : (
            <FormattedMessage id="user-profile-sidebar.hide-button" defaultMessage="Hide" />
          )}
        </Button>
        {canMute && (
          <Button preset="cancel" onClick={onMute}>
            <FormattedMessage id="user-profile-sidebar.mute-button" defaultMessage="Mute" />
          </Button>
        )}
        {canKick && (
          <Button preset="cancel" onClick={onKick}>
            <FormattedMessage id="user-profile-sidebar.kick-button" defaultMessage="Kick" />
          </Button>
        )}
      </Column>
    </Sidebar>
  );
}

UserProfileSidebar.propTypes = {
  className: PropTypes.string,
  userId: PropTypes.string,
  displayName: PropTypes.string,
  identityName: PropTypes.string,
  avatarPreview: PropTypes.node,
  hasMicPresence: PropTypes.bool,
  isSignedIn: PropTypes.bool,
  canPromote: PropTypes.bool,
  onPromote: PropTypes.func,
  canDemote: PropTypes.bool,
  onDemote: PropTypes.func,
  isHidden: PropTypes.bool,
  onToggleHidden: PropTypes.func,
  canMute: PropTypes.bool,
  isNetworkMuted: PropTypes.bool,
  onMute: PropTypes.func,
  canKick: PropTypes.bool,
  onKick: PropTypes.func,
  showBackButton: PropTypes.bool,
  onBack: PropTypes.func,
  onClose: PropTypes.func
};
