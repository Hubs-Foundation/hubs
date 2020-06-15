import React, { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { Page } from "../layout/Page";
import styles from "./SignInPage.scss";
import { Loader } from "../misc/Loader";
import configs from "../../utils/configs";
import { SDKContext } from "../sdk/SDKContext";

const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

function useVerify() {
  const [step, setStep] = useState(VerificationStep.verifying);
  const [error, setError] = useState();
  const sdk = useContext(SDKContext);

  useEffect(
    () => {
      const verifyAsync = async () => {
        try {
          const qs = new URLSearchParams(location.search);

          const authParams = {
            topic: qs.get("auth_topic"),
            token: qs.get("auth_token"),
            origin: qs.get("auth_origin"),
            payload: qs.get("auth_payload")
          };

          await sdk.verify(authParams);
          setStep(VerificationStep.complete);
        } catch (error) {
          setStep(VerificationStep.error);
          setError(error);
        }
      };

      verifyAsync();
    },
    [sdk]
  );

  return { step, error };
}

function EmailVerifying() {
  return (
    <div className={styles.signInContainer}>
      <h1>Email Verifying</h1>
      <Loader />
    </div>
  );
}

function EmailVerified() {
  const qs = new URLSearchParams(location.search);
  const origin = qs.get("auth_origin");

  return (
    <div className={styles.signInContainer}>
      <h1>Verification Complete</h1>
      <b>Please close this browser window and return to {origin}.</b>
    </div>
  );
}

function VerificationError({ error }) {
  return (
    <div className={styles.signInContainer}>
      <h1>Error Verifying Email</h1>
      <b>{(error && error.message) || "Unknown Error"}</b>
    </div>
  );
}

VerificationError.propTypes = {
  error: PropTypes.object
};

export function VerifyPage() {
  const { step, error } = useVerify();

  return (
    <Page style={{ backgroundImage: configs.image("home_background", true), backgroundSize: "cover" }}>
      {step === VerificationStep.verifying && <EmailVerifying />}
      {step === VerificationStep.complete && <EmailVerified />}
      {step === VerificationStep.error && <VerificationError error={error} />}
    </Page>
  );
}
