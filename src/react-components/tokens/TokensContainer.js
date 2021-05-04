// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TokensModal } from "./TokensModal";
import { Token } from "./Token";
import { fetchMyTokens, revokeToken } from "./token-utils";
import { FormattedMessage } from "react-intl";
import styles from "./Token.scss";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
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

  // const onRevokeTokenClose = () => {
  //   setShowRevokeTokenModal(false);
  // };

  return (
    <div>
      {showCreateTokenModal && (
        <div className={styles.tokenModalContainer}>
          <TokensModal
            startStep={0}
            title={<FormattedMessage id="tokens-modal.create_token_title" defaultMessage="Create Token" />}
            onClose={onCreateTokenModalClose}
          />
        </div>
      )}
      {/* {showRevokeTokenModal && (
        <TokensModal
          startStep={4}
          title={<FormattedMessage id="tokens-modal.create_token_title" defaultMessage="Revoke Token" />}
          onClose={onRevokeTokenClose}
        />
      )} */}

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
        return <Token onRevokeToken={revokeToken} key={t.id} {...t} />;
      })}
      {/* </TokensModal> */}
    </div>
  );
}
