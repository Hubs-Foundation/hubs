import React, { useState, createContext, useContext, useEffect, Children, cloneElement } from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { Modal } from "../modal/Modal";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function TokensModal({ onCreateToken, children }) {
  const [ scopes, setScopes ] = useState(["read_rooms", "write_rooms"]);
  return (
    <Modal title={<FormattedMessage id="tokens-modal.title" defaultMessage="Tokens" />} disableFullscreen>
      <button
        onClick={function() {
          console.log(scopes)
          onCreateToken({ scopes });
        }}
      >Create Token</button>
      {children}
    </Modal>
  );
}

TokensModal.propTypes = {
  children: PropTypes.node,
  onCreateToken: PropTypes.func
};
