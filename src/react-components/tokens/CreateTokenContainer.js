import React, { useReducer, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
// import { Spinner } from "../misc/Spinner";
import { CreateToken } from "./CreateToken";
import { createToken, fetchAvailableScopes } from "./token-utils";

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
  selectedScopes: [],
  token: "",
  error: "",
  showNoScopesSelectedError: false
};

function createTokenReducer(state, action) {
  console.log("inside reducer");
  console.log(state);
  console.log(action);
  switch (action.type) {
    case CreateTokenActions.submitCreateToken:
      return { ...state, step: steps.pending };
    case CreateTokenActions.createTokenSuccess:
      return { ...state, step: steps.success, token: action.token };
    case CreateTokenActions.createTokenError:
      return { ...state, step: steps.error, error: action.errorMsg };
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
    default:
      return state;
  }
}

function useCreateToken() {
  const [state, dispatch] = useReducer(createTokenReducer, initialCreateTokenState);

  const onCreateToken = async ({ scopes }) => {
    // TODO add no scopes error to the view
    if (scopes.length === 0) return dispatch({ type: CreateTokenActions.showNoScopesError });

    dispatch({ type: CreateTokenActions.submitCreateToken });

    try {
      const tokenInfoObj = await createToken({ scopes });
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

  return {
    step: state.step,
    scopes: state.scopes,
    selectedScopes: state.selectedScopes,
    token: state.token,
    error: state.error,
    showNoScopesSelectedError: state.showNoScopesSelectedError,
    onCreateToken,
    fetchScopes,
    toggleSelectedScopes
  };
}

export const CreateTokenContainer = () => {
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
    <CreateToken
      showNoScopesSelectedError={showNoScopesSelectedError}
      onCreateToken={onCreateToken}
      selectedScopes={selectedScopes}
      scopes={scopes}
      toggleSelectedScopes={toggleSelectedScopes}
    />
  );
};

// CreateTokenContainer.propTypes = {
//  onClose: PropTypes.func
// };

//  <CreateTokenModal onClose={() => onClose({ createdNewToken: !!token })}>
//    {step === steps.selectScopes && (
//      <SelectScopesAndCreate
//        showNoScopesError={showNoScopesSelectedError}
//        onCreateToken={onCreateToken}
//        selectedScopes={selectedScopes}
//        scopes={scopes}
//        toggleSelectedScopes={toggleSelectedScopes}
//      />
//    )}
//    {step === steps.pending && <Spinner />}
//    {step === steps.success && (
//      <ShowCredentialsOnce token={token} onClose={() => onClose({ createdNewToken: !!token })} />
//    )}
//    {step === steps.error && <Error errorMsg={error} onClose={onClose} />}
//  </CreateTokenModal>
