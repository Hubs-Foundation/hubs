// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { FormattedMessage } from "react-intl";
import { CloseButton } from "../input/CloseButton";
import { Column } from "../layout/Column";
import { Button } from "../input/Button";

export function RevokeTokenModal({ onClose, children }) {
  return (
    <Modal
      title={<FormattedMessage id="tokens-modal.revoke-token-title" defaultMessage="Revoke Tokens" />}
      afterTitle={<CloseButton onClick={onClose} />}
      disableFullscreen={false}
    >
      <Column padding>{children}</Column>
    </Modal>
  );
}

RevokeTokenModal.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func
};

export function ConfirmRevoke({ onClick }) {
  return (
    <div>
      <p>Are you sure you want to revoke this token?</p>
      <p>
        This is permanent, you can not undo this action. Any scripts or requests relying on this token will lose access.
      </p>
      <Button preset="cancel" onClick={onClick}>
        I understand, delete this token
      </Button>
    </div>
  );
}

ConfirmRevoke.propTypes = {
  onClick: PropTypes.func
};
