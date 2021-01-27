import React, { useState, createContext, useContext, useEffect, Children, cloneElement } from "react";
import PropTypes from "prop-types";
import { TokensModal } from "./TokensModal";
import { Token } from "./Token";
import { fetchMyTokens, createToken, revokeToken } from "./credentials";

export function TokensModalContainer() {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    async function updateTokens() {
      setTokens(await fetchMyTokens());
    }
    updateTokens();
  }, []);

  return (
    <TokensModal onCreateToken={createToken}>
      {tokens.map(function(t) {
        return <Token onRevokeToken={revokeToken} {...t} />;
      })}
    </TokensModal>
  );
}
