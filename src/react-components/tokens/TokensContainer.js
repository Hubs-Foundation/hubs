import React, { useState, useEffect, useContext } from "react";
import { Token } from "./Token";
import { fetchMyTokens } from "./token-utils";
import { FormattedMessage } from "react-intl";
import styles from "./Token.scss";
import { RevokeTokenModal } from "./RevokeTokenModal";
import { RevealTokenModal } from "./RevealTokenModal";
import { TokenList } from "./TokenList";
import { NoAccess } from "./NoAccess";
import { CenteredModalWrapper } from "../layout/CenteredModalWrapper";
import { AuthContext } from "../auth/AuthContext";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
  //  const [showRevealTokenModal, setRevealTokenModal] = useState(false);
  //  const [showRevokeTokenModal, setShowRevokeTokenModal] = useState(false);
  //  const [selectedRevokeId, setSelectedRevokeId] = useState();
  const auth = useContext(AuthContext); // Re-render when you log in/out.

  useEffect(() => {
    // async function updateTokens() {
    //   setTokens(await fetchMyTokens());
    // }
    // updateTokens();
  }, []);

  const onRevealTokenModalClose = async ({ createdNewToken }) => {
    // setRevealTokenModal(false);
    // if (createdNewToken) {
    //   setTokens(await fetchMyTokens());
    // }
  };

  const onRevokeTokenClose = ({ removedTokenId }) => {
    // if (removedTokenId) setTokens(tokens.filter(token => token.id !== removedTokenId));
    // setShowRevokeTokenModal(false);
    // setSelectedRevokeId("");
  };

  return (
    <div>
      {
        //   {showRevealTokenModal && (
        //     <CenteredModalWrapper>
        //       <RevealTokenModal onClose={onRevealTokenModalClose} />
        //     </CenteredModalWrapper>
        //   )}
        //   {showRevokeTokenModal && (
        //     <CenteredModalWrapper>
        //       <RevokeTokenModal selectedId={selectedRevokeId} onClose={onRevokeTokenClose} />
        //     </CenteredModalWrapper>
        //   )}
      }

      <button
        as="a"
        preset="primary"
        onClick={() => {
          //          if (!showRevealTokenModal) setRevealTokenModal(true);
        }}
      >
        <FormattedMessage id="tokens.create-token" defaultMessage="Create Token" />
      </button>
      {auth?.isAdmin ? <TokenList /> : <NoAccess />}

      {tokens.map(t => {
        return (
          <Token
            showRevokeToken={id => {
              // if (!showRevokeTokenModal) {
              //   setSelectedRevokeId(id);
              //   setShowRevokeTokenModal(true);
              // }
            }}
            key={t.id}
            {...t}
          />
        );
      })}
    </div>
  );
}
