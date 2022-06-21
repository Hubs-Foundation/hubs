import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as EnterIcon } from "../icons/Enter.svg";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as ShowIcon } from "../icons/Show.svg";
import { ReactComponent as SettingsIcon } from "../icons/Settings.svg";
import styles from "./RoomEntryModal.scss";
import styleUtils from "../styles/style-utils.scss";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { Column } from "../layout/Column";
import { AppLogo } from "../misc/AppLogo";
import { FormattedMessage } from "react-intl";

export function RoomEntryModal({
  className,
  roomName,
  showJoinRoom,
  onJoinRoom,
  showEnterOnDevice,
  onEnterOnDevice,
  showSpectate,
  onSpectate,
  showOptions,
  onOptions,
  ...rest
}) {
  const breakpoint = useCssBreakpoints();
  return (
    <Modal className={classNames(styles.roomEntryModal, className)} disableFullscreen {...rest}>
      <Column center  className={styles.content}>
        {breakpoint !== "sm" &&
          breakpoint !== "md" && (
            <div className={styles.logoContainer}>
              <AppLogo />
            </div>
          )}
          </Column>
          <Column center className={styles.content}>
        <div className={styles.roomName}>
          <p>{roomName}</p>
         
        </div>
        <Column className={styles.buttons}>
          {showJoinRoom && (
            <Button preset="accent4" onClick={onJoinRoom}>
              <EnterIcon />
              <span>
                <FormattedMessage id="room-entry-modal.join-room-button" defaultMessage="Enter Room" />
              </span>
            </Button>
          )}
          {showEnterOnDevice && (
            <Button preset="accent4" onClick={onEnterOnDevice}>
              <VRIcon />
              <span>
                <FormattedMessage id="room-entry-modal.enter-on-device-button" defaultMessage="Use VR" />
              </span>
            </Button>
          )}
          {showSpectate && (
            <Button preset="accent4" onClick={onSpectate}>
              <ShowIcon />
              <span>
                <FormattedMessage id="room-entry-modal.spectate-button" defaultMessage="Observe" />
              </span>
            </Button>
          )}
          {showOptions &&
            breakpoint !== "sm" && (
              <>
              
                <Button preset="accent4" className={styleUtils.showLg} onClick={onOptions}>
                  <SettingsIcon />
                  <span>
                    <FormattedMessage id="room-entry-modal.options-button" defaultMessage="Options" />
                  </span>
                </Button>
              </>
            )}
        </Column>
      </Column>
    </Modal>
  );
}

RoomEntryModal.propTypes = {
  className: PropTypes.string,
  roomName: PropTypes.string.isRequired,
  showJoinRoom: PropTypes.bool,
  onJoinRoom: PropTypes.func,
  showEnterOnDevice: PropTypes.bool,
  onEnterOnDevice: PropTypes.func,
  showSpectate: PropTypes.bool,
  onSpectate: PropTypes.func,
  showOptions: PropTypes.bool,
  onOptions: PropTypes.func
};

RoomEntryModal.defaultProps = {
  showJoinRoom: true,
  showEnterOnDevice: true,
  showSpectate: true,
  showOptions: true
};
