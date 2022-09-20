import React from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { Modal } from "../modal/Modal";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

export function VerifyingEmail() {
  return (
    <Column center padding grow>
      <b>
        <FormattedMessage id="verify-modal.verifying-email" defaultMessage="���[�U�[�F�ؒ�" />
      </b>
      <br />
      <Spinner />
    </Column>
  );
}

export function EmailVerified({ origin }) {
  return (
    <Column center padding grow>
      <b>
        <FormattedMessage id="verify-modal.verification-complete" defaultMessage="�F�؊���" />
      </b>
      <p>
        <FormattedMessage
          id="verify-modal.close-window"
          defaultMessage="�Ǘ��҃��[�h�ő���ł���悤�ɂȂ�܂����B�u���E�U����邩����̃A�C�R�����N���b�N���ăy�[�W���X�V���Ă��������B"
          values={{ origin }}
        />
      </p>
    </Column>
  );
}

EmailVerified.propTypes = {
  origin: PropTypes.string.isRequired
};

export function VerificationError({ error }) {
  return (
    <Column center padding grow>
      <b>
        <FormattedMessage id="verify-modal.error" defaultMessage="���[���F�؃G���[" />
      </b>
      <p>
        {(error && error.message) || (
          <FormattedMessage id="verify-modal.unknown-error" defaultMessage="���[�U�[�F�؃G���[" />
        )}
      </p>
    </Column>
  );
}

VerificationError.propTypes = {
  error: PropTypes.object
};

export function VerifyModal({ children }) {
  return (
    <Modal title={<FormattedMessage id="verify-modal.title" defaultMessage="�F��" />} disableFullscreen>
      {children}
    </Modal>
  );
}

VerifyModal.propTypes = {
  children: PropTypes.node
};
