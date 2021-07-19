import React, { useState, useEffect, useContext } from "react";
import { fetchMyTokens } from "./token-utils";
import { RevokeTokenContainer } from "./RevokeTokenContainer";
import { TokenList } from "./TokenList";
import { NoAccess } from "./NoAccess";
import { AuthContext } from "../auth/AuthContext";
import { CreateTokenContainer } from "./CreateTokenContainer";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [showRevokeTokenModal, setShowRevokeTokenModal] = useState(false);
  const [selectedRevokeId, setSelectedRevokeId] = useState();

  const auth = useContext(AuthContext); // Re-render when you log in/out.

  const fetchTokens = async () => {
    try {
      setIsFetching(true);
      setTokens(await fetchMyTokens());
      setIsFetching(false);
    } catch (err) {
      setError("Error fetching tokens: " + err.message);
      setIsFetching(false);
      return null;
    }
  };

  useEffect(
    () => {
      async function updateTokens() {
        await fetchTokens();
      }
      if (auth?.isAdmin) updateTokens();
    },
    [auth.isAdmin]
  );

  const onCreateTokenClose = async ({ createdNewToken }) => {
    setShowCreateToken(false);
    if (createdNewToken) await fetchTokens();
  };

  const onRevokeToken = ({ revokeId }) => {
    setShowRevokeTokenModal(true);
    setSelectedRevokeId(revokeId);
  };

  const onRevokeTokenClose = ({ removedTokenId }) => {
    if (removedTokenId) setTokens(tokens.filter(token => token.id !== removedTokenId));
    setShowRevokeTokenModal(false);
    setSelectedRevokeId("");
  };

  return (
    <div>
      {showRevokeTokenModal && <RevokeTokenContainer tokenId={selectedRevokeId} onClose={onRevokeTokenClose} />}
      {auth?.isAdmin ? (
        showCreateToken ? (
          <CreateTokenContainer onClose={onCreateTokenClose} />
        ) : (
          <TokenList
            error={error}
            isFetching={isFetching}
            tokens={tokens}
            onRevokeToken={onRevokeToken}
            showCreateToken={() => {
              setShowCreateToken(true);
            }}
          />
        )
      ) : (
        <NoAccess />
      )}
    </div>
  );
}
