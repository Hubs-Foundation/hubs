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
        <FormattedMessage id="verify-modal.verifying-email" defaultMessage="ユーザー認証中" />
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
        <FormattedMessage id="verify-modal.verification-complete" defaultMessage="認証完了" />
      </b>
      <p>
        <FormattedMessage
          id="verify-modal.close-window"
          defaultMessage="管理者モードで操作できるようになりました。ブラウザを閉じるか左上のアイコンをクリックしてページを更新してください。"
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
        <FormattedMessage id="verify-modal.error" defaultMessage="メール認証エラー" />
      </b>
      <p>
        {(error && error.message) || (
          <FormattedMessage id="verify-modal.unknown-error" defaultMessage="ユーザー認証エラー" />
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
    <Modal title={<FormattedMessage id="verify-modal.title" defaultMessage="認証" />} disableFullscreen>
      {children}
    </Modal>
  );
}

VerifyModal.propTypes = {
  children: PropTypes.node
};
