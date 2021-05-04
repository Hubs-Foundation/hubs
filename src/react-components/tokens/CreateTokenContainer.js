import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { PathActions } from "three";
import { AuthContext } from "../auth/AuthContext";

const CreateTokenActions = {
    submitCreateToken: "submitCreateToken",
    createTokenSuccess: "createTokenSuccess",
    createTokenError: "createTokenError",
    createTokenFetching: "createTokenFetching",
    fetchingScopes: "fetchingScopes",
    fetchingScopesSuccess: "fetchingScopesSuccess",
    fetchingScopesError: "fetchingScopesError",
    showNoScopesError: "showNoScopesError",
    toggleScopeChange: "toggleScopeChange"
}

const initialCreateTokenState = {
    step: steps.selectScopes,
    scopes: [],
    selectedScopes: new Set(),
    token: "",
    error: "",
    showNoScopesSelectedError: false,
}

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
        case CreateTokenActions.fetchingScopesSuccess:
            return { showNoScopesSelectedError: true, ...state };
        case CreateTokenActions.toggleScopeChange:
            return { selectedScopes: action.newSelectedScopes };
    }
}

function useCreateToken() {
    const auth = useContext(AuthContext);
    const [state, dispatch] = useReducer()
}

const steps = {
    selectScopes: "selectScopes",
    success: "success",
    pending: "pending",
    error: "error"
}



export function CreateTokenContainer({ onClose }) {
  // 0 - select scopes, 1 - loading new api token, 2 - show api token once, 3 - errors, 4 - revokeToken
  const [currentStep, setStep] = useState(startStep);
  const [scopes, setAvailableScopes] = useState([]);
  const [selectedScopes, setSelectedScopes] = useState(new Set());
  const [token, setToken] = useState("");
  const [errorMsg, setError] = useState("");

  useEffect(
    () => {
      setAvailableScopes(fetchAvailableScopes());
      console.log("fetchAvailableScopes() ret:");
      console.log(fetchAvailableScopes());
    },
    [scopes[0]]
  );

  const onCreateToken = async ({ scopes }) => {
    if (scopes.length === 0) {
        setError("Must select at least one scope")
    }
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
      <>

      </>
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
