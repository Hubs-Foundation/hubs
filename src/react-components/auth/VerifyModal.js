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
        <FormattedMessage id="verify-modal.verifying-email" defaultMessage="Verifying Email" />
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
        <FormattedMessage id="verify-modal.verification-complete" defaultMessage="Verification Complete" />
      </b>
      <p>
        <FormattedMessage
          id="verify-modal.close-window"
          defaultMessage="Please close this browser window and return to {origin}."
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
        <FormattedMessage id="verify-modal.error" defaultMessage="Error Verifying Email" />
      </b>
      <p>
        {(error && error.message) || (
          <FormattedMessage id="verify-modal.unknown-error" defaultMessage="Unknown Error" />
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
    <Modal title={<FormattedMessage id="verify-modal.title" defaultMessage="Verify" />} disableFullscreen>
      {children}
    </Modal>
  );
}

VerifyModal.propTypes = {
  children: PropTypes.node
};
