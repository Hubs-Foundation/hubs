import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import styles from "./EnterOnDeviceModal.scss";
import { IconButton } from "../input/IconButton";

export function EnterOnDeviceModal({
  className,
  shortUrl,
  code,
  headsetConnected,
  onEnterOnConnectedHeadset,
  onBack,
  ...rest
}) {
  const codeCharacters = code.split("");

  return (
    <Modal
      title="Enter on Device"
      beforeTitle={
        <IconButton onClick={onBack}>
          <ChevronBackIcon />
          <span>Back</span>
        </IconButton>
      }
      className={className}
      contentClassName={styles.content}
      {...rest}
    >
      <h1>Enter on Wireless Headset / Phone</h1>
      <p>{"In your device's web browser, go to:"}</p>
      <div className={styles.shortUrlContainer}>{shortUrl}</div>
      <p>Then, enter this one-time code:</p>
      <div className={styles.codeContainer}>
        {codeCharacters.map((char, i) => (
          <div key={i} className={styles.codeLetter}>
            {char}
          </div>
        ))}
      </div>
      <small>Your account and avatar will be transferred to the device.</small>
      <small>Keep this page open to use this code.</small>
      {headsetConnected && (
        <>
          <hr data-or-text="or" />
          <h1>Enter on Connected Headset</h1>
          <p>You have a VR headset connected to this device.</p>
          <Button preset="purple" onClick={onEnterOnConnectedHeadset}>
            <VRIcon />
            <span>Enter in VR</span>
          </Button>
        </>
      )}
    </Modal>
  );
}

EnterOnDeviceModal.propTypes = {
  className: PropTypes.string,
  shortUrl: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  headsetConnected: PropTypes.bool,
  onEnterOnConnectedHeadset: PropTypes.func,
  onBack: PropTypes.func
};
