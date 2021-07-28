import React from "react";
import PropTypes from "prop-types";
import { Button } from "../input/Button";
import { FormattedMessage } from "react-intl";
import { Row } from "../layout/Row";
import styles from "./Token.scss";
import { useIntl, defineMessages } from "react-intl";

const tokenTypes = {
  account: defineMessages({
    type: {
      id: "token-type.account-token",
      defaultMessage: "Account Token"
    }
  }),
  app: defineMessages({
    type: {
      id: "token-type.app-token",
      defaultMessage: "App Token"
    }
  })
};

export function Token({ tokenInfo, onRevokeToken }) {
  const { account_id, inserted_at, scopes, subject_type } = tokenInfo;
  const intl = useIntl();
  const { type = null } = tokenTypes[subject_type];
  if (type === null) {
    console.warn(
      "WARNING: Token type translation was undefined. Meaning the frontend is missing the token type translation for: " +
        subject_type
    );
  }

  return (
    <div className={styles.borderGrey}>
      <Row padding="sm" spaceBetween noWrap className={styles.backgroundWhite}>
        <Row breakpointColumn="md" topMargin="md" childrenMarginR="xl">
          <div>
            <span>
              <b>{type && intl.formatMessage(type)}</b>
            </span>
          </div>
          <div>
            <span>{account_id}</span>
          </div>
          <div>
            <span>{inserted_at}</span>
          </div>
        </Row>
        <Button sm preset="cancel" onClick={onRevokeToken}>
          <FormattedMessage id="tokens.revoke-token" defaultMessage="Revoke" />
        </Button>
      </Row>
      <Row padding="sm" className={styles.backgroundGrey}>
        <div className={styles.scopes}>
          <b>
            <FormattedMessage id="tokens.scopes" defaultMessage="Scopes" />
          </b>
        </div>
        <Row topMargin="md" childrenMarginR="md">
          {scopes.map(scopeName => {
            // TODO translation?
            return (
              <p className={styles.scope} key={scopeName}>
                {scopeName}
              </p>
            );
          })}
        </Row>
      </Row>
    </div>
  );
}

Token.propTypes = {
  tokenInfo: PropTypes.shape({
    account_id: PropTypes.number,
    id: PropTypes.string,
    inserted_at: PropTypes.string,
    is_revoked: PropTypes.bool,
    scopes: PropTypes.array,
    subject_type: PropTypes.string,
    token: PropTypes.string,
    updated_at: PropTypes.string
  }),
  onRevokeToken: PropTypes.func
};
