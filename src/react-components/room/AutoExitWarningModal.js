import React from "react";
import { FormattedMessage, defineMessages, useIntl } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";

export const AutoExitReason = {
  concurrentSession: "concurrentSession",
  idle: "idle"
};

const messages = defineMessages({
  [AutoExitReason.concurrentSession]: {
    id: "autoexit.concurrent_subtitle",
    defaultMessage: "You have started another session."
  },
  [AutoExitReason.idle]: {
    id: "autoexit.idle_subtitle",
    defaultMessage: "You have been idle for too long."
  }
});

export function AutoExitWarningModal({ onCancel, reason, secondsRemaining }) {
  const intl = useIntl();

  return (
    <Modal title="Warning">
      <Column padding center>
        <b>
          <FormattedMessage id="autoexit.title" />
          <span>{secondsRemaining}</span>
          <FormattedMessage id="autoexit.title_units" />
        </b>
        <p>{intl.formatMessage(messages[reason])}</p>
        <Button preset="red" onClick={onCancel}>
          <FormattedMessage id="autoexit.cancel" />
        </Button>
      </Column>
    </Modal>
  );
}

AutoExitWarningModal.propTypes = {
  reason: PropTypes.string.isRequired,
  secondsRemaining: PropTypes.number.isRequired,
  onCancel: PropTypes.func
};
