import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { VerifyModal, VerificationError, EmailVerified, VerifyingEmail } from "./VerifyModal";

const VerificationStep = {
  verifying: "verifying",
  complete: "complete",
  error: "error"
};

function useVerify() {
  const [step, setStep] = useState(VerificationStep.verifying);
  const [error, setError] = useState();
  const { verify } = useContext(AuthContext);

  useEffect(() => {
    const verifyAsync = async () => {
      try {
        const qs = new URLSearchParams(location.search);

        const authParams = {
          topic: qs.get("auth_topic"),
          token: qs.get("auth_token"),
          origin: qs.get("auth_origin"),
          payload: qs.get("auth_payload")
        };

        await verify(authParams);
        setStep(VerificationStep.complete);
      } catch (error) {
        setStep(VerificationStep.error);
        setError(error);
      }
    };

    verifyAsync();
  }, [verify]);

  return { step, error };
}

export function VerifyModalContainer() {
  const { step, error } = useVerify();

  let content;

  if (step === VerificationStep.error) {
    content = <VerificationError error={error} />;
  } else if (step === VerificationStep.complete) {
    const qs = new URLSearchParams(location.search);
    const origin = qs.get("auth_origin");
    content = <EmailVerified origin={origin} />;
  } else {
    content = <VerifyingEmail />;
  }

  return <VerifyModal>{content}</VerifyModal>;
}
