import React from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { Button, CancelButton } from "../input/Button";
import { Column } from "../layout/Column";

export function CloseRoomModal({ onClose, onConfirm }) {
  return (
    <Modal
      title={<FormattedMessage id="close-room-modal.title" defaultMessage="Close Room" />}
      beforeTitle={<CloseButton onClick={onClose} />}
    >
      <Column padding center centerMd="both" grow>
        <p>
          <FormattedMessage
            id="close-room-modal.message"
            defaultMessage="Closing this room will remove yourself and others from the room, shutting it down permanently.{linebreak}Are you sure? This action cannot be undone."
            values={{ linebreak: <br /> }}
          />
        </p>
        <Button preset="accept" onClick={onConfirm}>
          <FormattedMessage id="close-room-modal.confirm" defaultMessage="Yes, Close Room" />
        </Button>
        <CancelButton onClick={onClose} />
      </Column>
    </Modal>
  );
}

CloseRoomModal.propTypes = {
  onConfirm: PropTypes.func,
  onClose: PropTypes.func
};
