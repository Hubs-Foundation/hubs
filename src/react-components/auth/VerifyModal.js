import React from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { Modal } from "../modal/Modal";
import { Column } from "../layout/Column";

export const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

export function EmailVerifying() {
  return (
    <Column center padding grow>
      <b>Email Verifying</b>
      <br />
      <Spinner />
    </Column>
  );
}

export function EmailVerified({ origin }) {
  return (
    <Column center padding grow>
      <b>Verification Complete</b>
      <p>Please close this browser window and return to {origin}.</p>
    </Column>
  );
}

EmailVerified.propTypes = {
  origin: PropTypes.string.isRequired
};

export function VerificationError({ error }) {
  return (
    <Column center padding grow>
      <b>Error Verifying Email</b>
      <p>{(error && error.message) || "Unknown Error"}</p>
    </Column>
  );
}

VerificationError.propTypes = {
  error: PropTypes.object
};

export function VerifyModal({ children }) {
  return (
    <Modal title="Verify" disableFullscreen>
      {children}
    </Modal>
  );
}

VerifyModal.propTypes = {
  children: PropTypes.node
};
