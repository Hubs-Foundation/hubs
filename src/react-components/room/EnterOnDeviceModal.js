import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import styles from "./EnterOnDeviceModal.scss";
import { IconButton } from "../input/IconButton";

export function EnterOnDeviceModal({
  className,
  shortUrl,
  loadingCode,
  code,
  headsetConnected,
  unsupportedBrowser,
  onEnterOnConnectedHeadset,
  onBack,
  ...rest
}) {
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
      contentClassName={classNames(styles.content, { [styles.loadingCode]: loadingCode })}
      {...rest}
    >
      {loadingCode ? (
        <h1>Generating join code...</h1>
      ) : (
        <>
          <h1>Enter on Wireless Headset / Phone</h1>
          <p>{"In your device's web browser, go to:"}</p>
          <div className={styles.shortUrlContainer}>{shortUrl}</div>
          <p>Then, enter this one-time code:</p>
          <div className={styles.codeContainer}>
            {code.split("").map((char, i) => (
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
              {unsupportedBrowser ? (
                <>
                  <p>{"WebVR isn't supported in this browser, to enter with Oculus or SteamVR, use Firefox."}</p>
                  <Button
                    as="a"
                    preset="orange"
                    href="https://www.mozilla.org/firefox/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span>Download Firefox</span>
                  </Button>
                </>
              ) : (
                <>
                  <p>You have a VR headset connected to this device.</p>
                  <Button preset="purple" onClick={onEnterOnConnectedHeadset}>
                    <VRIcon />
                    <span>Enter in VR</span>
                  </Button>
                </>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
}

EnterOnDeviceModal.propTypes = {
  className: PropTypes.string,
  shortUrl: PropTypes.string.isRequired,
  loadingCode: PropTypes.bool,
  code: PropTypes.string.isRequired,
  headsetConnected: PropTypes.bool,
  unsupportedBrowser: PropTypes.bool,
  onEnterOnConnectedHeadset: PropTypes.func,
  onBack: PropTypes.func
};
