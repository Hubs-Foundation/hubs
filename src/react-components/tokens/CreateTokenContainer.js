import React, { useReducer, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
// import { Spinner } from "../misc/Spinner";
import { CreateToken } from "./CreateToken";
import { RevealTokenModal } from "./RevealTokenModal";
import { createToken, fetchAvailableScopes } from "./token-utils";

const CreateTokenActions = {
  submitCreateToken: "submitCreateToken",
  createTokenSuccess: "createTokenSuccess",
  createTokenError: "createTokenError",
  fetchingScopes: "fetchingScopes",
  fetchingScopesSuccess: "fetchingScopesSuccess",
  fetchingScopesError: "fetchingScopesError",
  showNoScopesError: "showNoScopesError",
  toggleScopeChange: "toggleScopeChange",
  toggleTokenTypeChange: "toggleTokenTypeChange"
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
  selectedScopes: [],
  selectedTokenType: "account",
  token: "",
  error: "",
  showNoScopesSelectedError: false,
  showRevealTokenModal: false
};

function createTokenReducer(state, action) {
  console.log("inside reducer");
  console.log(state);
  console.log(action);
  switch (action.type) {
    case CreateTokenActions.submitCreateToken:
      return { ...state, step: steps.pending };
    case CreateTokenActions.createTokenSuccess:
      return { ...state, showRevealTokenModal: true, token: action.token };
    case CreateTokenActions.createTokenError:
      return { ...state, error: action.errorMsg };
    case CreateTokenActions.fetchingScopesSuccess:
      console.log("FETCHED SCOPES");
      return { ...state, scopes: action.scopes };
    case CreateTokenActions.fetchingScopesError:
      return { ...state, step: steps.error, error: "Error fetching scopes, please try again later." };
    case CreateTokenActions.showNoScopesError:
      return { ...state, showNoScopesSelectedError: true };
    case CreateTokenActions.toggleScopeChange: {
      return {
        ...state,
        selectedScopes: state.selectedScopes.includes(action.scopeName)
          ? state.selectedScopes.filter(name => name !== action.scopeName)
          : [...state.selectedScopes, action.scopeName]
      };
    }
    case CreateTokenActions.toggleTokenTypeChange: {
      return {
        ...state,
        selectedTokenType: action.tokenTypeValue
      };
    }
    default:
      return state;
  }
}

function useCreateToken() {
  const [state, dispatch] = useReducer(createTokenReducer, initialCreateTokenState);

  const onCreateToken = async ({ tokenType, scopes }) => {
    // TODO add no scopes error to the view
    if (scopes.length === 0) return dispatch({ type: CreateTokenActions.showNoScopesError });

    dispatch({ type: CreateTokenActions.submitCreateToken });

    try {
      const tokenInfoObj = await createToken({ tokenType, scopes });
      const token = tokenInfoObj.credentials[0].token;
      dispatch({ type: CreateTokenActions.createTokenSuccess, token });
    } catch (err) {
      dispatch({ type: CreateTokenActions.createTokenError, errorMsg: err.message });
    }
  };

  const fetchScopes = useCallback(
    () => {
      // TODO async fetch implement
      try {
        const scopes = fetchAvailableScopes();
        dispatch({ type: CreateTokenActions.fetchingScopesSuccess, scopes });
      } catch (err) {
        dispatch({ type: CreateTokenActions.fetchingScopesError, errorMsg: err.message });
      }
    },
    [state.scopes]
  );

  const toggleSelectedScopes = scopeName => {
    dispatch({ type: CreateTokenActions.toggleScopeChange, scopeName });
  };

  const toggleTokenType = tokenTypeValue => {
    dispatch({ type: CreateTokenActions.toggleTokenTypeChange, tokenTypeValue });
  };

  return {
    step: state.step,
    scopes: state.scopes,
    selectedScopes: state.selectedScopes,
    token: state.token,
    error: state.error,
    showNoScopesSelectedError: state.showNoScopesSelectedError,
    onCreateToken,
    fetchScopes,
    toggleSelectedScopes,
    toggleTokenType,
    selectedTokenType: state.selectedTokenType,
    showRevealTokenModal: state.showRevealTokenModal
  };
}

export const CreateTokenContainer = ({ onClose }) => {
  const {
    scopes,
    selectedScopes,
    showRevealTokenModal,
    token,
    error,
    showNoScopesSelectedError,
    onCreateToken,
    fetchScopes,
    toggleSelectedScopes,
    toggleTokenType,
    selectedTokenType
  } = useCreateToken();

  useEffect(
    () => {
      fetchScopes();
    },
    [scopes[0]]
  );

  return (
    <>
      {showRevealTokenModal && <RevealTokenModal token={token} selectedScopes={selectedScopes} onClose={onClose} />}
      <CreateToken
        showNoScopesSelectedError={showNoScopesSelectedError}
        onCreateToken={onCreateToken}
        selectedScopes={selectedScopes}
        selectedTokenType={selectedTokenType}
        scopes={scopes}
        toggleSelectedScopes={toggleSelectedScopes}
        toggleTokenType={toggleTokenType}
        error={error}
      />
    </>
  );
};
