// TODO ADD TRANSLATIONS
/* eslint-disable @calm/react-intl/missing-formatted-message */
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { FormattedMessage } from "react-intl";
import { CloseButton } from "../input/CloseButton";
import { Column } from "../layout/Column";
import copy from "copy-to-clipboard";
import { TextInputField } from "../input/TextInputField";
import { Button } from "../input/Button";

export function CreateTokenModal({ onClose, children }) {
  return (
    <Modal
      title={<FormattedMessage id="tokens-modal.create-token-title" defaultMessage="Tokens" />}
      afterTitle={<CloseButton onClick={onClose} />}
      disableFullscreen={false}
    >
      <Column padding>{children}</Column>
    </Modal>
  );
}

CreateTokenModal.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func
};

export function SelectScopesAndCreate({
  onCreateToken,
  showNoScopesError,
  selectedScopes,
  scopes,
  toggleSelectedScopes
}) {
  return (
    <form>
      <p>
        <FormattedMessage id="tokens-modal.scopes" defaultMessage="Scopes" />:
      </p>
      {showNoScopesError && (
        <p>
          <FormattedMessage
            id="tokens-modal.warning-at-least-one-scope"
            defaultMessage="Must select at least one scope!"
          />
        </p>
      )}
      {scopes.map(scopeName => (
        <div key={scopeName}>
          <label id={scopeName} htmlFor={`${scopeName}-cb`}>
            <input
              type="checkbox"
              id={`${scopeName}-cb`}
              name={scopeName}
              value={scopeName}
              onChange={() => {
                toggleSelectedScopes(scopeName);
              }}
              checked={selectedScopes.includes(scopeName)}
            />
            {scopeName}
          </label>
          <br />
        </div>
      ))}
      <Button
        preset="primary"
        onClick={function(e) {
          e && e.preventDefault();
          onCreateToken({ scopes: selectedScopes });
        }}
      >
        Create Token
      </Button>
    </form>
  );
}

SelectScopesAndCreate.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func,
  onCreateToken: PropTypes.func,
  showNoScopesError: PropTypes.bool,
  selectedScopes: PropTypes.array,
  scopes: PropTypes.array,
  toggleSelectedScopes: PropTypes.func
};

export function Error({ errorMsg, onClose }) {
  return (
    <>
      <p>An Error occurred please try again later.</p>
      <p>{errorMsg}</p>
      <Button preset="primary" onClick={onClose}>
        Close
      </Button>
    </>
  );
}

Error.propTypes = {
  errorMsg: PropTypes.string,
  onClose: PropTypes.func
};

export function ShowCredentialsOnce({ token, onClose }) {
  const [copied, setClickedCopy] = useState(false);
  const onClickCopy = e => {
    e && e.preventDefault();
    copy(token);
    setClickedCopy(true);
  };
  return (
    <div>
      <p>Please save your API Token in a safe place. This will be shown only once.</p>
      <TextInputField
        label="Token"
        value={token}
        description={<>{copied && <p>Copied!</p>}</>}
        beforeInput={
          <Button preset="accept" onClick={onClickCopy}>
            Copy
          </Button>
        }
      />
      <Button preset="primary" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

ShowCredentialsOnce.propTypes = {
  token: PropTypes.string,
  onClose: PropTypes.func
};
