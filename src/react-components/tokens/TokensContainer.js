import React, { useState, useEffect } from "react";
import { Token } from "./Token";
import { fetchMyTokens } from "./token-utils";
import { FormattedMessage } from "react-intl";
import styles from "./Token.scss";
import { CreateTokenContainer } from "./CreateTokenContainer";
import { RevokeTokenContainer } from "./RevokeTokenContainer";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [showRevokeTokenModal, setShowRevokeTokenModal] = useState(false);
  const [selectedRevokeId, setSelectedRevokeId] = useState();

  useEffect(() => {
    async function updateTokens() {
      setTokens(await fetchMyTokens());
    }
    updateTokens();
  }, []);

  const onCreateTokenModalClose = async ({ createdNewToken }) => {
    setShowCreateTokenModal(false);
    if (createdNewToken) {
      setTokens(await fetchMyTokens());
    }
  };

  const onRevokeTokenClose = ({ removedTokenId }) => {
    if (removedTokenId) setTokens(tokens.filter(token => token.id !== removedTokenId));
    setShowRevokeTokenModal(false);
    setSelectedRevokeId("");
  };

  return (
    <div>
      {showCreateTokenModal && (
        <div className={styles.tokenModalContainer}>
          <CreateTokenContainer onClose={onCreateTokenModalClose} />
        </div>
      )}
      {showRevokeTokenModal && (
        <div className={styles.tokenModalContainer}>
          <RevokeTokenContainer selectedId={selectedRevokeId} onClose={onRevokeTokenClose} />
        </div>
      )}

      <button
        as="a"
        preset="primary"
        onClick={() => {
          if (!showCreateTokenModal) setShowCreateTokenModal(true);
        }}
      >
        <FormattedMessage id="tokens.create-token" defaultMessage="Create Token" />
      </button>

      {tokens.map(t => {
        return (
          <Token
            showRevokeToken={id => {
              if (!showRevokeTokenModal) {
                setSelectedRevokeId(id);
                setShowRevokeTokenModal(true);
              }
            }}
            key={t.id}
            {...t}
          />
        );
      })}
    </div>
  );
}
