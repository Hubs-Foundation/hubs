import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import styles from "./MicPermissionsModal.scss";
import { BackButton } from "../input/BackButton";
import { Column } from "../layout/Column";

export function MicPermissionsModal({ className, error, onClickErrorButton, errorButtonLabel, onBack, ...rest }) {
  return (
    <Modal title="Enter on Device" beforeTitle={<BackButton onClick={onBack} />} className={className} {...rest}>
      <Column padding center className={styles.content}>
        <h1>Grant Microphone Permissions</h1>
        <p>
          Microphone access needed to be heard by others.<br />Microphone can be muted in room.
        </p>
        <div className={styles.microphoneIconContainer}>
          <MicrophoneIcon />
        </div>
        {error && (
          <>
            <p className={styles.error}>{error}</p>
            <Button preset="blue" onClick={onClickErrorButton}>
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
