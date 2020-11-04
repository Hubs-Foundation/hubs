import React from "react";
import PropTypes from "prop-types";
import styles from "./VerifyModal.scss";
import { Spinner } from "../misc/Spinner";
import { Modal } from "../modal/Modal";

export const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

export function EmailVerifying() {
  return (
    <div className={styles.modalContent}>
      <b>Email Verifying</b>
      <Spinner />
    </div>
  );
}

export function EmailVerified({ origin }) {
  return (
    <div className={styles.modalContent}>
      <b>Verification Complete</b>
      <p>Please close this browser window and return to {origin}.</p>
    </div>
  );
}

EmailVerified.propTypes = {
  origin: PropTypes.string.isRequired
};

export function VerificationError({ error }) {
  return (
    <div className={styles.modalContent}>
      <b>Error Verifying Email</b>
      <p>{(error && error.message) || "Unknown Error"}</p>
    </div>
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
