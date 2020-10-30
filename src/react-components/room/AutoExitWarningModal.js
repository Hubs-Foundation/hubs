import React from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import styles from "./AutoExitWarningModal.scss";

export function AutoExitWarningModal({ onCancel, message, secondsRemaining }) {
  return (
    <Modal title="Warning">
      <div className={styles.autoExitWarningModal}>
        <b>
          <FormattedMessage id="autoexit.title" />
          <span>{secondsRemaining}</span>
          <FormattedMessage id="autoexit.title_units" />
        </b>
        <p>
          <FormattedMessage id={message} />
        </p>
        <Button preset="red" onClick={onCancel}>
          <FormattedMessage id="autoexit.cancel" />
        </Button>
      </div>
    </Modal>
  );
}

AutoExitWarningModal.propTypes = {
  message: PropTypes.string,
  secondsRemaining: PropTypes.number,
  onCancel: PropTypes.func
};
