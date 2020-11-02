import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { Modal } from "../modal/Modal";
import styles from "./PromoteClientModal.scss";
import { Button } from "../input/Button";
import { CloseButton } from "../input/CloseButton";

export function PromoteClientModal({ onClose, onConfirm, displayName }) {
  return (
    <Modal title="Promote User" beforeTitle={<CloseButton onClick={onClose} />} contentClassName={styles.modalContent}>
      <p>
        <FormattedMessage id="promote.message" />
      </p>
      <Button preset="accept" onClick={onConfirm}>
        <FormattedMessage id="promote.confirm-prefix" />
        <span>{displayName}</span>
      </Button>
      <Button preset="cancel" onClick={onClose}>
        <FormattedMessage id="promote.cancel" />
      </Button>
    </Modal>
  );
}

PromoteClientModal.propTypes = {
  displayName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func
};
