import React, { useState, createContext, useContext, useEffect, Children, cloneElement } from "react";
import PropTypes from "prop-types";

export function Token({ onRevokeToken, account_id, id, inserted_at, is_revoked, scopes, subject_type, token, updated_at }) {
  return (
    <div key={id}>

      <button
        onClick={function() {
          console.log(scopes)
          onRevokeToken({ id });
        }}
      >Revoke Token</button>
      <p>Account ID: {account_id}</p>
      <p>ID: {id}</p>
      <p>Inserted at: {inserted_at}</p>
      <p>Revoked: {is_revoked.toString()}</p>
      {scopes.map(function(s) {
        return <p>Scope: {s}</p>;
      })}
      <p>Subject Type: {subject_type}</p>
      <p>Token: {token || "(redacted)"}</p>
      <p>Updated At: {updated_at}</p>
    </div>
  );
}
Token.propTypes = {
  onRevokeToken: PropTypes.func,
  account_id: PropTypes.string,
  id: PropTypes.string,
  inserted_at: PropTypes.string,
  is_revoked: PropTypes.bool,
  scopes: PropTypes.array,
  subject_type: PropTypes.string,
  token: PropTypes.string,
  updated_at: PropTypes.string
};
