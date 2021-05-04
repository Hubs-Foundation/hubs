// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { Modal } from "../modal/Modal";
import { FormattedMessage } from "react-intl";
import { createToken, fetchAvailableScopes, revokeToken } from "./token-utils";
import { CloseButton } from "../input/CloseButton";

export function TokensModal({ type }) {
  // 0 - select scopes, 1 - loading new api token, 2 - show api token once, 3 - errors, 4 - revokeToken
  const [currentStep, setStep] = useState(startStep);
  const [token, setToken] = useState("");
  const [errorMsg, setError] = useState("");

  const onCreateToken = async ({ scopes }) => {
    setStep(1);
    try {
      const tokenInfoObj = await createToken({ scopes });
      const token = tokenInfoObj.credentials[0].token;
      setToken(token);
      setStep(2);
    } catch (err) {
      setError(err.message);
      setStep(3);
    }
  };

  const onRevokeToken = async () => {
    revokeToken;
  };

  return (
    <Modal
      title={<FormattedMessage id="tokens-modal.title" defaultMessage="Tokens" />}
      afterTitle={<CloseButton onClick={onClose} />}
      disableFullscreen={false}
    >
      {currentStep === 0 && <SelectScopesAndCreate onCreateToken={onCreateToken} />}
      {currentStep === 1 && <Spinner />}
      {currentStep === 2 && <ShowCredentialsOnce token={token} onClose={onClose} />}
      {currentStep === 3 && <Error errorMsg={errorMsg} onClose={onClose} />}
    </Modal>
  );
}

function SelectScopesAndCreate({ onCreateToken }) {
  const [scopes, setAvailableScopes] = useState([]);
  const [selectedScopes, setSelectedScopes] = useState(new Set());

  useEffect(
    () => {
      setAvailableScopes(fetchAvailableScopes());
      console.log("fetchAvailableScopes() ret:");
      console.log(fetchAvailableScopes());
    },
    [scopes[0]]
  );

  const toggleSelectedScopes = scopeName => {
    const updated = new Set(selectedScopes);
    if (updated.has(scopeName)) {
      updated.delete(scopeName);
    } else {
      updated.add(scopeName);
    }
    setSelectedScopes(updated);
  };

  const onSubmit = e => {
    e && e.preventDefault();
  };

  return (
    <form onSubmit={e => onSubmit(e)}>
      <p>Scopes:</p>
      {scopes.map(scopeName => (
        <ScopeCheckbox
          key={scopeName}
          name={scopeName}
          selectedScopes={selectedScopes}
          toggleSelectedScopes={toggleSelectedScopes}
        />
      ))}

      <button
        onClick={function() {
          console.log(selectedScopes);
          onCreateToken({ scopes: Array.from(selectedScopes) });
        }}
      >
        Create Token
      </button>
    </form>
  );
}

function ScopeCheckbox({ name, selectedScopes, toggleSelectedScopes }) {
  const onChange = (e, name) => {
    e && e.preventDefault();
    toggleSelectedScopes(name);
  };
  return (
    <>
      <input
        type="checkbox"
        id={name}
        name={name}
        value={name}
        onChange={e => {
          onChange(e, name);
        }}
        checked={selectedScopes.has(name)}
      />
      <label htmlFor={name}>{name}</label>
      <br />
    </>
  );
}

function Error({ errorMsg, onClose }) {
  return (
    <>
      <p>An Error occurred please try again later</p>
      <p>{errorMsg}</p>
      <button onClick={onClose}>Ok</button>
    </>
  );
}

function ShowCredentialsOnce({ token, onClose }) {
  return (
    <div>
      <p>Please save your API Token in a safe place. This will be shown only once.</p>
      <p>{token}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

TokensModal.propTypes = {
  children: PropTypes.node
};
