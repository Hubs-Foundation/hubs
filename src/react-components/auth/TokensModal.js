// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState, createContext, useContext, useEffect, Children, cloneElement } from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { Modal } from "../modal/Modal";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { fetchAvailableScopes } from "./credentials";
import { CloseButton } from "../input/CloseButton";

export function TokensModal({ onCreateToken, children, onClose }) {
  // 0 - select scopes, 1 - loading new api token, 2 - show api token once, 3 - error
  const [currentStep, setStep] = useState(0);
  const [credentials, setCredentials] = useState("");

  return (
    <Modal
      title={<FormattedMessage id="tokens-modal.title" defaultMessage="Tokens" />}
      afterTitle={<CloseButton onClick={onClose} />}
      disableFullscreen
    >
      {currentStep === 0 && <SelectScopesAndCreate onCreateToken={onCreateToken} setCredentials setStep />}
      {currentStep === 1 && <Spinner />}
      {currentStep === 2 && <ShowCredentialsOnce credentials setStep />}
      {currentStep === 3 && <Error onClose />}
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

    // this.props.store.update({
    //   profile: { avatarId: this.state.avatar.avatar_id }
    // });
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

function Error() {
  return <p>An Error occurred please try again later</p>;
}

function ShowCredentialsOnce() {
  return <p>I am showing credentials</p>;
}

TokensModal.propTypes = {
  children: PropTypes.node,
  onCreateToken: PropTypes.func
};
