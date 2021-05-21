import React from "react";
import PropTypes from "prop-types";
import { Button } from "../input/Button";
import { FormattedMessage } from "react-intl";
import { Row } from "../layout/Row";
import styles from "./Token.scss";

export function Token({ tokenInfo, onRevokeToken }) {
  const { account_id, id, inserted_at, is_revoked, scopes, subject_type, token, updated_at } = tokenInfo;
  return (
    <div className={styles.borderGrey}>
      <Row padding="xs" spaceBetween className={styles.backgroundWhite}>
        <span>{inserted_at}</span>
        <Button sm preset="cancel" onClick={onRevokeToken}>
          <FormattedMessage id="tokens.revoke-token" defaultMessage="Revoke" />
        </Button>
      </Row>
      <Row padding="xs" spaceBetween className={styles.backgroundGrey}>
        <div className={styles.scopes}>
          <b>
            <FormattedMessage id="tokens.scopes" defaultMessage="Scopes" />
          </b>
        </div>
        <Row>
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
    // <p>Account ID: {account_id}</p>
    // <p>ID: {id}</p>
    // <p>Inserted at: {inserted_at}</p>
    // <p>Revoked: {is_revoked.toString()}</p>
    // <p>Scopes:</p>
    // <ul>
    //   {scopes.map(function(s) {
    //     return <li key={s}>Scope: {s}</li>;
    //   })}
    // </ul>
    // <p>Subject Type: {subject_type}</p>
    // <p>Token: {token || "(redacted)"}</p>
    // <p>Updated At: {updated_at}</p>
    // </div>
  );
}

Token.propTypes = {
  token: PropTypes.shape({
    account_id: PropTypes.string,
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
