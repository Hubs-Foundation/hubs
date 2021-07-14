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
import { BrowserRouter, Route } from "react-router-dom";
import { CreateTokenContainer } from "./CreateTokenContainer";
import { CreateToken } from "./CreateToken";

export function TokensContainer() {
  const [tokens, setTokens] = useState([]);
  const [showRevealTokenModal, setRevealTokenModal] = useState(false);
  //  const [showRevokeTokenModal, setShowRevokeTokenModal] = useState(false);
  //  const [selectedRevokeId, setSelectedRevokeId] = useState();
  const auth = useContext(AuthContext); // Re-render when you log in/out.
  console.log(auth);
  console.log(NoAccess);

  useEffect(
    () => {
      async function updateTokens() {
        setTokens(await fetchMyTokens());
      }
      if (auth?.isAdmin) updateTokens();
    },
    [auth.isAdmin]
  );

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

  console.log(auth);

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
      {auth?.isAdmin ? (
        <BrowserRouter>
          <Route path="/asd">
            <TokenList tokens={tokens} onRevokeToken={onRevokeTokenClose} />
          </Route>
          <Route path="/">
            <CreateTokenContainer />
          </Route>
        </BrowserRouter>
      ) : (
        <NoAccess />
      )}
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
