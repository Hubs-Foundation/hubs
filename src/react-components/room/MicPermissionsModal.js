import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import styles from "./MicPermissionsModal.scss";
import { BackButton } from "../input/BackButton";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function MicPermissionsModal({ className, error, onClickErrorButton, errorButtonLabel, onBack, ...rest }) {
  return (
    <Modal
      title={<FormattedMessage id="mic-permissions-modal.title" defaultMessage="Enter on Device" />}
      beforeTitle={<BackButton onClick={onBack} />}
      className={className}
      {...rest}
    >
      <Column padding center className={styles.content}>
        <b>
          <FormattedMessage
            id="mic-permissions-modal.grant-mic-permissions"
            defaultMessage="Grant Microphone Permissions"
          />
        </b>
        <small>
          <FormattedMessage
            id="mic-permissions-modal.mic-access-needed"
            defaultMessage="Microphone access needed to be heard by others.{linebreak}Microphone can be muted in room."
            values={{ linebreak: <br /> }}
          />
        </small>
        <div className={styles.microphoneIconContainer}>
          <MicrophoneIcon />
        </div>
        {error && (
          <>
            <small className={styles.error}>{error}</small>
            <Button preset="primary" onClick={onClickErrorButton}>
              {errorButtonLabel}
            </Button>
          </>
        )}
      </Column>
    </Modal>
  );
}

MicPermissionsModal.propTypes = {
  className: PropTypes.string,
  error: PropTypes.string,
  errorButtonLabel: PropTypes.string,
  onClickErrorButton: PropTypes.func,
  onBack: PropTypes.func
};
