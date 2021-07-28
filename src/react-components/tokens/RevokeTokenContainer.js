import React, { useState } from "react";
import PropTypes from "prop-types";
import { CenteredModalWrapper } from "../layout/CenteredModalWrapper";
import { RevokeTokenModal } from "./RevokeTokenModal";
import { revokeToken } from "./token-utils";

export function RevokeTokenContainer({ onClose, tokenId }) {
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const onConfirmRevoke = async () => {
    setIsPending(true);
    try {
      await revokeToken({ id: tokenId });
      onClose({ removedTokenId: tokenId });
    } catch (err) {
      setError(err.message);
    }
    setIsPending(false);
  };

  return (
    <CenteredModalWrapper>
      <RevokeTokenModal
        isPending={isPending}
        error={error}
        onRevoke={onConfirmRevoke}
        onClose={() => onClose({ removedTokenId: null })}
      />
    </CenteredModalWrapper>
  );
}

RevokeTokenContainer.propTypes = {
  onClose: PropTypes.func,
  tokenId: PropTypes.string
};
