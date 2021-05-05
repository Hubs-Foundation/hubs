import React from "react";
import { Error } from "./CreateTokenModal";
import { RevokeTokenModal, ConfirmRevoke } from "./RevokeTokenModal";

export default {
  title: "Tokens/RevokeTokensModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const ConfirmRevokeModal = () => {
  return (
    <RevokeTokenModal>
      <ConfirmRevoke />
    </RevokeTokenModal>
  );
};

export const ErrorRevokeModal = () => {
  return (
    <RevokeTokenModal>
      <Error errorMsg="I am error!" />
    </RevokeTokenModal>
  );
};
