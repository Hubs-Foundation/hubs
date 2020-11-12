import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { CloseButton } from "../input/CloseButton";
import { Modal } from "../modal/Modal";
import { FormattedMessage } from "react-intl";
import styles from "./SignInModal.scss";
import { Button } from "../input/Button";
import { TextInputField } from "../input/TextInputField";
import { Column } from "../layout/Column";

export const SignInStep = {
  submit: "submit",
  waitForVerification: "waitForVerification",
  complete: "complete"
};

export function SubmitEmail({ onSubmitEmail, initialEmail, showPrivacy, privacyUrl, showTerms, termsUrl, message }) {
  const [email, setEmail] = useState(initialEmail);

  const onSubmitForm = useCallback(
    e => {
      e.preventDefault();
      onSubmitEmail(email);
    },
    [onSubmitEmail, email]
  );

  const onChangeEmail = useCallback(
    e => {
      setEmail(e.target.value);
    },
    [setEmail]
  );

  return (
    <Column center padding as="form" onSubmit={onSubmitForm} className={styles.modalContent}>
      <p>{message || <FormattedMessage id="sign-in.prompt" />}</p>
      <TextInputField
        name="email"
        type="email"
        required
        value={email}
        onChange={onChangeEmail}
        placeholder="example@example.com"
      />
      {(showTerms || showPrivacy) && (
        <b className={styles.terms}>
          By proceeding, you agree to the{" "}
          {showTerms && (
            <>
              <a rel="noopener noreferrer" target="_blank" href={termsUrl}>
                terms of use
              </a>{" "}
            </>
          )}
          {showTerms && showPrivacy && "and "}
          {showPrivacy && (
            <a rel="noopener noreferrer" target="_blank" href={privacyUrl}>
              privacy notice
            </a>
          )}.
        </b>
      )}
      <Button preset="accept" type="submit">
        Next
      </Button>
    </Column>
  );
}

SubmitEmail.defaultProps = {
  initialEmail: ""
};

SubmitEmail.propTypes = {
  message: PropTypes.string,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  showPrivacy: PropTypes.bool,
  privacyUrl: PropTypes.string,
  initialEmail: PropTypes.string,
  onSubmitEmail: PropTypes.func.isRequired
};

export function WaitForVerification({ email, onCancel, showNewsletterSignup }) {
  return (
    <Column center padding className={styles.modalContent}>
      <p>
        <FormattedMessage id="sign-in.auth-started" values={{ email }} />
      </p>
      {showNewsletterSignup && (
        <p className={styles.newsletter}>
          Want Hubs news sent to your inbox?<br />
          <a href="https://eepurl.com/gX_fH9" target="_blank" rel="noopener noreferrer">
            Subscribe for updates
          </a>
        </p>
      )}
      <Button preset="cancel" onClick={onCancel}>
        Cancel
      </Button>
    </Column>
  );
}

WaitForVerification.propTypes = {
  showNewsletterSignup: PropTypes.bool,
  email: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired
};

export function SignInComplete({ message, continueText, onContinue }) {
  return (
    <Column center padding className={styles.modalContent}>
      <b>{message}</b>
      <p>{continueText}</p>
      <Button preset="green" onClick={onContinue}>
        Continue
      </Button>
    </Column>
  );
}

SignInComplete.propTypes = {
  message: PropTypes.string.isRequired,
  continueText: PropTypes.string.isRequired,
  onContinue: PropTypes.func.isRequired
};

export function SignInModal({ closeable, onClose, children, ...rest }) {
  return (
    <Modal title="Sign In" beforeTitle={closeable && <CloseButton onClick={onClose} />} {...rest}>
      {children}
    </Modal>
  );
}

SignInModal.propTypes = {
  closeable: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node
};
