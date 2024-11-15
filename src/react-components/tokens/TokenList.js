import React from "react";
import PropTypes from "prop-types";
import { Token } from "./Token";
import { Row } from "../layout/Row";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { Button } from "../input/Button";
import styleUtils from "../styles/style-utils.scss";
import styles from "./Tokens.scss";
import { SpinWhileTrue } from "../layout/SpinWhileTrue";
import { Center } from "../layout/Center";

export const TokenList = ({ tokens, onRevokeToken, onShowCreateToken, error, isFetching }) => {
  return (
    <div>
      <TokenMenuHeader />
      <Row spaceBetween breakpointColumn="sm" topMargin="lg">
        <h2>
          <FormattedMessage id="empty-token.title2" defaultMessage="Token List" />
        </h2>
        <Button preset="primary" sm onClick={onShowCreateToken}>
          <FormattedMessage id="tokens.button-create-token" defaultMessage="Create token" />
        </Button>
      </Row>
      <SpinWhileTrue isSpinning={isFetching}>
        {error && (
          <Row padding="sm" className={styles.revokeWarning}>
            <p>{`An Error occured: ${error}`}</p>
          </Row>
        )}
        {tokens && tokens.length ? (
          <Column className={styleUtils.xlMarginY}>
            {tokens.map(token => (
              <Token key={token.id} tokenInfo={token} onRevokeToken={() => onRevokeToken({ revokeId: token.id })} />
            ))}
          </Column>
        ) : (
          <div className={styleUtils.xlMarginY}>
            <Row padding="md" className={styles.backgroundWhite}>
              <Center>
                <FormattedMessage id="tokens.no-tokens-created" defaultMessage="No tokens created." />
              </Center>
            </Row>
          </div>
        )}
      </SpinWhileTrue>
    </div>
  );
};

TokenList.propTypes = {
  tokens: PropTypes.array,
  onRevokeToken: PropTypes.func,
  onShowCreateToken: PropTypes.func,
  error: PropTypes.string,
  isFetching: PropTypes.bool
};

const TokenMenuHeader = () => (
  <Column gap="xl">
    <h1>
      <FormattedMessage id="empty-token.title" defaultMessage="API Tokens" />
    </h1>
    <p>
      <FormattedMessage id="tokens.create-tokens-description" defaultMessage="Create tokens to access the" />{" "}
      <a href="https://github.com/Hubs-Foundation/reticulum/blob/master/guides/api.md" rel="noreferrer noopener">
        <FormattedMessage id="tokens.create-tokens-description-hubs-api" defaultMessage="Hubs API" />
      </a>
      .
    </p>
  </Column>
);
