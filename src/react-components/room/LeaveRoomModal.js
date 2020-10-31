import React from "react";
import styles from "./LeaveRoomModal.scss";
import { useIntl, defineMessages } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { Button } from "../input/Button";

const messages = defineMessages({
  "join-room-message": {
    id: "leave-room-dialog.join-room.message",
    defaultMessage: "Joining a new room will leave this one. Are you sure?"
  },
  "join-room-confirm": {
    id: "leave-room-dialog.join-room.confirm",
    defaultMessage: "Join Room"
  },
  "create-room-message": {
    id: "leave-room-dialog.create-room.message",
    defaultMessage: "Creating a new room will leave this one. Are you sure?"
  },
  "create-room-confirm": {
    id: "leave-room-dialog.create-room.confirm",
    defaultMessage: "Leave Room"
  }
});

export function LeaveRoomModal({ messageType, destinationUrl, onClose }) {
  const intl = useIntl();

  return (
    <Modal title="Leave Room" beforeTitle={<CloseButton onClick={onClose} />} contentClassName={styles.leaveRoomModal}>
      <p>{intl.formatMessage(messages[`${messageType}-message`])}</p>
      <Button as="a" preset="cancel" href={destinationUrl} rel="noopener noreferrer">
        {intl.formatMessage(messages[`${messageType}-confirm`])}
      </Button>
    </Modal>
  );
}

LeaveRoomModal.propTypes = {
  messageType: PropTypes.string,
  destinationUrl: PropTypes.string,
  onClose: PropTypes.func
};
