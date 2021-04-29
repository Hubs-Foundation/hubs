// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TokensModal } from "./TokensModal";
import { Token } from "./Token";
import { fetchMyTokens, revokeToken } from "./credentials";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
  // Stages for create
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [showRevokeTokenModal, setShowRevokeTokenModal] = useState(false);

  useEffect(() => {
    async function updateTokens() {
      setTokens(await fetchMyTokens());
    }
    updateTokens();
  }, []);

  const onCreateTokenModalClose = () => {
    setShowCreateTokenModal(false);
  };

  const onRevokeTokenClose = () => {
    setShowRevokeTokenModal(false);
  };

  return (
    <div>
      {showCreateTokenModal && <TokensModal onClose={onCreateTokenModalClose} />}
      <button
        onClick={() => {
          if (!showCreateTokenModal) setShowCreateTokenModal(true);
        }}
      >
        Create Token
      </button>

      {tokens.map(function(t) {
        return <Token onRevokeToken={revokeToken} key={t.id} {...t} />;
      })}
      {/* </TokensModal> */}
    </div>
  );
}
