import React, { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { Page } from "../layout/Page";
import styles from "./SignInPage.scss";
import { Loader } from "../misc/Loader";
import { AuthContext } from "../auth/AuthContext";

const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

function useVerify(authParams) {
  const [step, setStep] = useState(VerificationStep.verifying);
  const [error, setError] = useState();
  const auth = useContext(AuthContext);

  useEffect(
    () => {
      const verifyAsync = async () => {
        try {
          await auth.verify(authParams);
          setStep(VerificationStep.complete);
        } catch (error) {
          setStep(VerificationStep.error);
          setError(error);
        }
      };

      verifyAsync();
    },
    [authParams, auth]
  );

  return { step, error };
}

function EmailVerifying() {
  <div className={styles.signInContainer}>
    <h1>Email Verifying</h1>
    <Loader />
  </div>;
}

function EmailVerified({ origin }) {
  <div className={styles.signInContainer}>
    <h1>Verification Complete</h1>
    <b>Please close this browser window and return to {origin}.</b>
  </div>;
}

EmailVerified.propTypes = {
  origin: PropTypes.string
};

function VerificationError({ error }) {
  <div className={styles.signInContainer}>
    <h1>Error Verifying Email</h1>
    <b>{error.message || "Unknown Error"}</b>
  </div>;
}

VerificationError.propTypes = {
  error: PropTypes.object
};

export function VerifyPage() {
  const qs = new URLSearchParams(location.search);

  const authParams = {
    topic: qs.get("auth_topic"),
    token: qs.get("auth_token"),
    origin: qs.get("auth_origin"),
    payload: qs.get("auth_payload")
  };

  const { step, error } = useVerify(authParams);

  return (
    <Page>
      {step === VerificationStep.verifying && <EmailVerifying />}
      {step === VerificationStep.complete && <EmailVerified origin={authParams.origin} />}
      {step === VerificationStep.error && <VerificationError error={error} />}
    </Page>
  );
}
