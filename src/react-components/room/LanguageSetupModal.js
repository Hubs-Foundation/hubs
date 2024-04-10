import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeOffIcon } from "../icons/VolumeOff.svg";
import { ReactComponent as InfoIcon } from "../icons/Info.svg";
import styles from "./MicSetupModal.scss";
import { BackButton } from "../input/BackButton";
import { SelectInputField } from "../input/SelectInputField";
import { ToggleInput } from "../input/ToggleInput";
import { Column } from "../layout/Column";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";
import { PermissionStatus } from "../../utils/media-devices-utils";
import { Spinner } from "../misc/Spinner";
import { ToolTip } from "@mozilla/lilypad-ui";

export const titleMessages = defineMessages({
  languageSetup: {
    id: "language-setup-modal.title",
    defaultMessage: "Language Setup"
  }
});

export function LanguageSetupModal({ className, languageOptions, onChangeLanguage, onEnterRoom, onBack, ...rest }) {
  const intl = useIntl();
  return (
    <Modal
      title={intl.formatMessage(titleMessages["languageSetup"])}
      beforeTitle={<BackButton onClick={onBack} />}
      className={className}
      {...rest}
    >
      <Column center padding grow className={styles.content}>
        <p>
          <FormattedMessage
            id="language-setup-modal.check-mic"
            defaultMessage="Choose your language before entering."
          />
        </p>
        <div className={styles.audioCheckContainer}>
          <div className={styles.audioIoContainer}>
            {
              <>
                {
                  <div className={styles.selectionContainer}>
                    <p style={{ alignSelf: "start" }}>
                      <FormattedMessage id="language-setup-modal.microphone-text" defaultMessage="Language" />
                    </p>
                    <SelectInputField
                      className={styles.selectionInput}
                      buttonClassName={styles.selectionInput}
                      onChange={onChangeLanguage}
                      {...languageOptions}
                    />
                  </div>
                }
              </>
            }
          </div>
        </div>
        <Button preset="primary" onClick={onEnterRoom}>
          <FormattedMessage id="language-setup-modal.enter-room-button" defaultMessage="Enter Room" />
        </Button>
      </Column>
    </Modal>
  );
}

LanguageSetupModal.propTypes = {
  className: PropTypes.string,
  LanguageOptions: PropTypes.object,
  onChangeLanguage: PropTypes.func,
  onEnterRoom: PropTypes.func,
  onBack: PropTypes.func
};
