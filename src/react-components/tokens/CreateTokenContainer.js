import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "../auth/AuthContext";
import { createToken, fetchAvailableScopes } from "./token-utils";
import { Modal } from "../modal/Modal";
import { FormattedMessage } from "react-intl";
import { CloseButton } from "../input/CloseButton";
import { Spinner } from "../misc/Spinner";

const CreateTokenActions = {
  submitCreateToken: "submitCreateToken",
  createTokenSuccess: "createTokenSuccess",
  createTokenError: "createTokenError",
  fetchingScopes: "fetchingScopes",
  fetchingScopesSuccess: "fetchingScopesSuccess",
  fetchingScopesError: "fetchingScopesError",
  showNoScopesError: "showNoScopesError",
  toggleScopeChange: "toggleScopeChange"
};

const steps = {
  selectScopes: "selectScopes",
  success: "success",
  pending: "pending",
  error: "error"
};

const initialCreateTokenState = {
  step: steps.selectScopes,
  scopes: [],
  selectedScopes: new Set(),
  token: "",
  error: "",
  showNoScopesSelectedError: false
};

function createTokenReducer(state, action) {
  switch (action.type) {
    case CreateTokenActions.submitCreateToken:
      return { step: steps.pending, ...state };
    case CreateTokenActions.createTokenSuccess:
      return { step: steps.success, token: action.token, ...state };
    case CreateTokenActions.createTokenError:
      return { step: steps.error, error: action.errorMsg, ...state };
    case CreateTokenActions.fetchingScopesSuccess:
      return { scopes: action.scopes, ...state };
    case CreateTokenActions.fetchingScopesError:
      return { step: steps.error, error: "Error fetching scopes, please try again later.", ...state };
    case CreateTokenActions.showNoScopesError:
      return { showNoScopesSelectedError: true, ...state };
    case CreateTokenActions.toggleScopeChange: {
      const updated = new Set(state.selectedScopes);
      if (updated.has(action.scopeName)) updated.delete(action.scopeName);
      else updated.add(action.scopeName);
      return { selectedScopes: updated };
    }
  }
}

function useCreateToken() {
  const auth = useContext(AuthContext);
  const [state, dispatch] = useReducer(createTokenReducer, initialCreateTokenState);

  const onCreateToken = async ({ scopes }) => {
    // TODO add no scopes error to the view
    if (scopes.length === 0) dispatch({ action: CreateTokenActions.showNoScopesError });

    dispatch({ action: CreateTokenActions.submitCreateToken });

    try {
      const tokenInfoObj = await createToken({ scopes });
      const token = tokenInfoObj.credentials[0].token;
      dispatch({ action: CreateTokenActions.createTokenSuccess, token });
    } catch (err) {
      dispatch({ action: CreateTokenActions.createTokenError, errorMsg: err.message });
    }
  };

  const fetchScopes = useCallback(async () => {
    // TODO async fetch implement
    try {
      const scopes = await fetchAvailableScopes();
      dispatch({ action: CreateTokenActions.fetchingScopesSuccess, scopes });
    } catch (err) {
      dispatch({ action: CreateTokenActions.fetchingScopesError, errorMsg: err.message });
    }
  }, []);

  const toggleSelectedScopes = scopeName => {
    dispatch({ action: CreateTokenActions.toggleScopeChange, scopeName });
  };

  // useEffect(
  //   () => {
  //     setAvailableScopes(fetchAvailableScopes());
  //     console.log("fetchAvailableScopes() ret:");
  //     console.log(fetchAvailableScopes());
  //   },
  //   [scopes[0]]
  // );

  return {
    step: state.step,
    scopes: state.scopes,
    selectedScopes: state.selectScopes,
    token: state.token,
    error: state.error,
    showNoScopesSelectedError: state.showNoScopesSelectedError,
    onCreateToken,
    fetchScopes,
    toggleSelectedScopes
  };
}

export function CreateTokenContainer({ onClose }) {
  const {
    step,
    scopes,
    selectedScopes,
    token,
    error,
    showNoScopesSelectedError,
    onCreateToken,
    fetchScopes,
    toggleSelectedScopes
  } = useCreateToken();

  useEffect(
    () => {
      fetchScopes();
    },
    [scopes[0]]
  );

  return (
    <Modal
      title={<FormattedMessage id="tokens-modal.title" defaultMessage="Tokens" />}
      afterTitle={<CloseButton onClick={onClose} />}
      disableFullscreen={false}
    >
      {step === steps.selectScopes && (
        <SelectScopesAndCreate
          showNoScopesError={showNoScopesSelectedError}
          onCreateToken={onCreateToken}
          selectedScopes={selectedScopes}
          scopes={scopes}
          toggleSelectedScopes={toggleSelectedScopes}
        />
      )}
      {step === steps.pending && <Spinner />}
      {step === steps.success && <ShowCredentialsOnce token={token} onClose={onClose} />}
      {step === steps.error && <Error errorMsg={error} onClose={onClose} />}
    </Modal>
  );
}
