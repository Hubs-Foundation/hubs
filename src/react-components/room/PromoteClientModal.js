import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { Modal } from "../modal/Modal";
import { Button, CancelButton } from "../input/Button";
import { CloseButton } from "../input/CloseButton";
import { Column } from "../layout/Column";

export function PromoteClientModal({ onClose, onConfirm, displayName }) {
  return (
    <Modal title="Promote User" beforeTitle={<CloseButton onClick={onClose} />}>
      <Column center padding>
        <p>
          <FormattedMessage
            id="promote-client-modal.message"
            defaultMessage="Promoting a user will grant full access to room settings and moderation tools.{linebreak}Are you sure?"
            values={{ linebreak: <br /> }}
          />
        </p>
        <Button preset="accept" onClick={onConfirm}>
          <FormattedMessage
            id="promote-client-modal.confirm-prefix"
            defaultMessage="Yes, promote {name}"
            values={{ name: displayName }}
          />
        </Button>
        <CancelButton preset="cancel" onClick={onClose} />
      </Column>
    </Modal>
  );
}

PromoteClientModal.propTypes = {
  displayName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func
};
