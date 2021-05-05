/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import PropTypes from "prop-types";

export function Token({
  // onRevokeToken,
  showRevokeToken,
  account_id,
  id,
  inserted_at,
  is_revoked,
  scopes,
  subject_type,
  token,
  updated_at
}) {
  return (
    <div key={id}>
      <button
        onClick={function() {
          console.log(scopes);
          showRevokeToken(id);
        }}
      >
        Revoke Token
      </button>
      <p>Account ID: {account_id}</p>
      <p>ID: {id}</p>
      <p>Inserted at: {inserted_at}</p>
      <p>Revoked: {is_revoked.toString()}</p>
      <p>Scopes:</p>
      <ul>
        {scopes.map(function(s) {
          return <li key={s}>Scope: {s}</li>;
        })}
      </ul>
      <p>Subject Type: {subject_type}</p>
      <p>Token: {token || "(redacted)"}</p>
      <p>Updated At: {updated_at}</p>
    </div>
  );
}

Token.propTypes = {
  showRevokeToken: PropTypes.func,
  account_id: PropTypes.string,
  id: PropTypes.string,
  inserted_at: PropTypes.string,
  is_revoked: PropTypes.bool,
  scopes: PropTypes.array,
  subject_type: PropTypes.string,
  token: PropTypes.string,
  updated_at: PropTypes.string
};
