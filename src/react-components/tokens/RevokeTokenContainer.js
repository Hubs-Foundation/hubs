import React, { useState } from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { ConfirmRevoke, Error, RevokeTokenModal } from "./RevokeTokenModal";
import { revokeToken } from "./token-utils";

const steps = {
  startRevoke: "startRevoke",
  success: "success",
  pending: "pending",
  error: "error"
};

export function RevokeTokenContainer({ selectedId, onClose }) {
  const [step, setStep] = useState(steps.startRevoke);
  const [error, setError] = useState("");

  const onConfirmRevoke = async () => {
    setStep(steps.pending);
    try {
      await revokeToken({ id: selectedId });
      onClose({ removedTokenId: selectedId });
    } catch (err) {
      setError(err.message);
      setStep(steps.error);
    }
  };

  return (
    <RevokeTokenModal onClose={onClose}>
      {step === steps.startRevoke && <ConfirmRevoke onClick={onConfirmRevoke} />}
      {step === steps.pending && <Spinner />}
      {step === steps.error && <Error errorMsg={error} onClose={onClose} />}
    </RevokeTokenModal>
  );
}

RevokeTokenContainer.propTypes = {
  onClose: PropTypes.func,
  selectedId: PropTypes.string
};
