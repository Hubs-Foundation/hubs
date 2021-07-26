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

  const auth = useContext(AuthContext);

  const fetchTokens = async () => {
    try {
      setIsFetching(true);
      setTokens(await fetchMyTokens());
    } catch (err) {
      setError("Error fetching tokens: " + err.message);
      return null;
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(
    () => {
      if (auth?.isAdmin) fetchTokens();
    },
    [auth.isAdmin]
  );

  const onCreateTokenCreated = async () => {
    setShowCreateToken(false);
    await fetchTokens();
  };

  const onCreateTokenCancelled = () => {
    setShowCreateToken(false);
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
          <CreateTokenContainer
            onCreateTokenCancelled={onCreateTokenCancelled}
            onCreateTokenCreated={onCreateTokenCreated}
          />
        ) : (
          <TokenList
            error={error}
            isFetching={isFetching}
            tokens={tokens}
            onRevokeToken={onRevokeToken}
            onShowCreateToken={() => {
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
