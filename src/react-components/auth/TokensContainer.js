// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState, createContext, useContext, useEffect, Children, cloneElement } from "react";
import PropTypes from "prop-types";
import { TokensModal } from "./TokensModal";
import { Token } from "./Token";
import { fetchMyTokens, createToken, revokeToken } from "./credentials";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
  // Stages for create
  const [createStage, setStage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function updateTokens() {
      setTokens(await fetchMyTokens());
    }
    updateTokens();
  }, []);

  const onModalClose = () => {
    setShowModal(false);
  };

  return (
    <div>
      {showModal && <TokensModal onCreateToken={createToken} onClose={onModalClose} />}
      <button
        onClick={() => {
          setShowModal(true);
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
