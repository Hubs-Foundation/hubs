import React from "react";
import { FormattedMessage, defineMessages, useIntl } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import styles from "./AutoExitWarningModal.scss";

const messages = defineMessages({
  concurrentSession: {
    id: "autoexit.concurrent_subtitle",
    defaultMessage: "You have started another session."
  },
  idle: {
    id: "autoexit.idle_subtitle",
    defaultMessage: "You have been idle for too long."
  }
});

export function AutoExitWarningModal({ onCancel, reason, secondsRemaining }) {
  const intl = useIntl();

  return (
    <Modal title="Warning">
      <div className={styles.autoExitWarningModal}>
        <b>
          <FormattedMessage id="autoexit.title" />
          <span>{secondsRemaining}</span>
          <FormattedMessage id="autoexit.title_units" />
        </b>
        <p>{intl.formatMessage(messages[reason])}</p>
        <Button preset="red" onClick={onCancel}>
          <FormattedMessage id="autoexit.cancel" />
        </Button>
      </div>
    </Modal>
  );
}

AutoExitWarningModal.propTypes = {
  reason: PropTypes.string.isRequired,
  secondsRemaining: PropTypes.number.isRequired,
  onCancel: PropTypes.func
};
