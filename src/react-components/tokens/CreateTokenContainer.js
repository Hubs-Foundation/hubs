import React, { useReducer, useEffect } from "react";
import PropTypes from "prop-types";
import { CreateToken } from "./CreateToken";
import { RevealTokenModal } from "./RevealTokenModal";
import { createToken, fetchAvailableScopes } from "./token-utils";
import { CenteredModalWrapper } from "../layout/CenteredModalWrapper";

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

const initialCreateTokenState = {
  scopes: [],
  selectedScopes: [],
  selectedTokenType: "account",
  token: "",
  error: "",
  showNoScopesSelectedError: false,
  showRevealTokenModal: false,
  isPending: false
};

function createTokenReducer(state, action) {
  switch (action.type) {
    case CreateTokenActions.submitCreateToken:
      return { ...state, isPending: true };
    case CreateTokenActions.createTokenSuccess:
      return { ...state, isPending: false, showRevealTokenModal: true, token: action.token };
    case CreateTokenActions.createTokenError:
      return { ...state, isPending: false, error: action.errorMsg };
    case CreateTokenActions.fetchingScopesSuccess:
      return { ...state, scopes: action.scopes };
    case CreateTokenActions.fetchingScopesError:
      return { ...state, error: "Error fetching scopes, please try again later." };
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

  const fetchScopes = async () => {
    try {
      const fetchedScopes = await fetchAvailableScopes();
      const scopes = fetchedScopes.scopes;
      dispatch({ type: CreateTokenActions.fetchingScopesSuccess, scopes });
    } catch (err) {
      dispatch({ type: CreateTokenActions.fetchingScopesError, errorMsg: err.message });
    }
  };

  const toggleSelectedScopes = scopeName => {
    dispatch({ type: CreateTokenActions.toggleScopeChange, scopeName });
  };

  const toggleTokenType = tokenTypeValue => {
    dispatch({ type: CreateTokenActions.toggleTokenTypeChange, tokenTypeValue });
  };

  return {
    isPending: state.isPending,
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

export const CreateTokenContainer = ({ onCreateTokenCreated, onCreateTokenCancelled }) => {
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
    selectedTokenType,
    isPending
  } = useCreateToken();

  useEffect(
    () => {
      fetchScopes();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopes[0]]
  );

  return (
    <>
      {showRevealTokenModal && (
        <CenteredModalWrapper>
          <RevealTokenModal token={token} selectedScopes={selectedScopes} onClose={onCreateTokenCreated} />
        </CenteredModalWrapper>
      )}
      <CreateToken
        showNoScopesSelectedError={showNoScopesSelectedError}
        onCreateToken={onCreateToken}
        selectedScopes={selectedScopes}
        selectedTokenType={selectedTokenType}
        scopes={scopes}
        toggleSelectedScopes={toggleSelectedScopes}
        toggleTokenType={toggleTokenType}
        error={error}
        onCreateTokenCancelled={onCreateTokenCancelled}
        isPending={isPending}
      />
    </>
  );
};

CreateTokenContainer.propTypes = {
  onClose: PropTypes.func,
  onCreateTokenCreated: PropTypes.func,
  onCreateTokenCancelled: PropTypes.func
};
