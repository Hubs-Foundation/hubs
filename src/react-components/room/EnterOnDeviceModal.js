import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import styles from "./EnterOnDeviceModal.scss";
import { BackButton } from "../input/BackButton";
import { Column } from "../layout/Column";
import { FormattedMessage, useIntl } from "react-intl";

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
  const intl = useIntl();

  return (
    <Modal
      title={<FormattedMessage id="enter-on-device-modal.title" defaultMessage="Enter on Device" />}
      beforeTitle={<BackButton onClick={onBack} />}
      className={className}
      {...rest}
    >
      <Column center={loadingCode ? "both" : true} padding grow>
        {loadingCode ? (
          <b>
            <FormattedMessage id="enter-on-device-modal.generating-code" defaultMessage="Generating join code..." />
          </b>
        ) : (
          <>
            <b>
              <FormattedMessage id="enter-on-device-modal.heading" defaultMessage="Enter on Wireless Headset / Phone" />
            </b>
            <small>
              <FormattedMessage
                id="enter-on-device-modal.short-url-directions"
                defaultMessage="In your device's web browser, go to:"
              />
            </small>
            <div className={styles.shortUrlContainer}>{shortUrl}</div>
            <small>
              <FormattedMessage
                id="enter-on-device-modal.code-directions"
                defaultMessage="Then, enter this one-time code:"
              />
            </small>
            <div className={styles.codeContainer}>
              {code.split("").map((char, i) => (
                <div key={i} className={styles.codeLetter}>
                  {char}
                </div>
              ))}
            </div>
            <strong>
              <FormattedMessage
                id="enter-on-device-modal.data-transfer"
                defaultMessage="Your account and avatar will be transferred to the device."
              />
            </strong>
            <strong>
              <FormattedMessage
                id="enter-on-device-modal.keep-page-open"
                defaultMessage="Keep this page open to use this code."
              />
            </strong>
            {headsetConnected && (
              <>
                <hr
                  data-or-text={intl.formatMessage({ id: "enter-on-device-modal.divider-label", defaultMessage: "or" })}
                />
                <b>
                  <FormattedMessage
                    id="enter-on-device-modal.headset-connected-heading"
                    defaultMessage="Enter on Connected Headset"
                  />
                </b>
                {unsupportedBrowser ? (
                  <>
                    <small>
                      <FormattedMessage
                        id="enter-on-device-modal.unsupported-browser"
                        defaultMessage="WebVR isn't supported in this browser, to enter with Oculus or SteamVR, use Firefox."
                      />
                    </small>
                    <Button
                      as="a"
                      preset="accent2"
                      href="https://www.mozilla.org/firefox/"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span>
                        <FormattedMessage
                          id="enter-on-device-modal.download-firefox-button"
                          defaultMessage="Download Firefox"
                        />
                      </span>
                    </Button>
                  </>
                ) : (
                  <>
                    <small>
                      <FormattedMessage
                        id="enter-on-device-modal.headset-connected-message"
                        defaultMessage="You have a VR headset connected to this device."
                      />
                    </small>
                    <Button preset="accent5" onClick={onEnterOnConnectedHeadset}>
                      <VRIcon />
                      <span>
                        <FormattedMessage id="enter-on-device-modal.enter-in-vr-button" defaultMessage="Enter in VR" />
                      </span>
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </Column>
    </Modal>
  );
}

EnterOnDeviceModal.propTypes = {
  className: PropTypes.string,
  shortUrl: PropTypes.string.isRequired,
  loadingCode: PropTypes.bool,
  code: PropTypes.string,
  headsetConnected: PropTypes.bool,
  unsupportedBrowser: PropTypes.bool,
  onEnterOnConnectedHeadset: PropTypes.func,
  onBack: PropTypes.func
};
