import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as ChevronBackIcon } from "../icons/ChevronBack.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import styles from "./MicPermissionsModal.scss";
import { IconButton } from "../input/IconButton";

export function MicPermissionsModal({ className, error, onClickErrorButton, errorButtonLabel, onBack, ...rest }) {
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
