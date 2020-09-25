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

export function RoomEntryModal({
  appName,
  logoSrc,
  className,
  roomName,
  showJoinRoom,
  onJoinRoom,
  showEnterOndevice,
  onEnterOnDevice,
  showSpectate,
  onSpectate,
  showOptions,
  onOptions,
  ...rest
}) {
  const breakpoint = useCssBreakpoints();
  return (
    <Modal
      className={classNames(styles.roomEntryModal, className)}
      contentClassName={styles.content}
      disableFullscreen
      {...rest}
    >
      {breakpoint !== "sm" && (
        <div className={styles.logoContainer}>
          <img src={logoSrc} alt={appName} />
        </div>
      )}
      <div className={styles.roomName}>
        <h5>Room Name</h5>
        <p>{roomName}</p>
      </div>
      <div className={styles.buttons}>
        {showJoinRoom && (
          <Button preset="blue" onClick={onJoinRoom}>
            <EnterIcon /> Join Room
          </Button>
        )}
        {showEnterOndevice && (
          <Button preset="purple" onClick={onEnterOnDevice}>
            <VRIcon /> Enter On Device
          </Button>
        )}
        {showSpectate && (
          <Button preset="orange" onClick={onSpectate}>
            <ShowIcon /> Spectate
          </Button>
        )}
        {showOptions &&
          breakpoint !== "sm" && (
            <>
              <hr className={styleUtils.showMd} />
              <Button preset="transparent" className={styleUtils.showMd} onClick={onOptions}>
                <SettingsIcon /> Options
              </Button>
            </>
          )}
      </div>
    </Modal>
  );
}

RoomEntryModal.propTypes = {
  appName: PropTypes.string,
  logoSrc: PropTypes.string,
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
