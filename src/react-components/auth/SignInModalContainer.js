import React, { useCallback, useReducer, useContext, useEffect } from "react";
import { TERMS, PRIVACY } from "../../constants";
import configs from "../../utils/configs";
import { AuthContext } from "./AuthContext";
import { SignInModal, SignInStep, WaitForVerification, SubmitEmail, SubmitOIDC } from "./SignInModal";

const SignInAction = {
  submitEmail: "submitEmail",
  submitOIDC: "submitOIDC",
  verificationReceived: "verificationReceived",
  cancel: "cancel"
};

const initialSignInState = {
  step: SignInStep.submit,
  email: ""
};

function loginReducer(state, action) {
  switch (action.type) {
    case SignInAction.submitEmail:
      return { step: SignInStep.waitForVerification, email: action.email };
    case SignInAction.submitOIDC:
      return { step: SignInStep.waitForVerification };
    case SignInAction.verificationReceived:
      return { ...state, step: SignInStep.complete };
    case SignInAction.cancel:
      return { ...state, step: SignInStep.submit };
  }
}

function useSignIn() {
  const auth = useContext(AuthContext);
  const [state, dispatch] = useReducer(loginReducer, initialSignInState);

  const submitEmail = useCallback(
    email => {
      auth.signIn(email).then(() => {
        dispatch({ type: SignInAction.verificationReceived });
      });
      dispatch({ type: SignInAction.submitEmail, email });
    },
    [auth]
  );

  const submitOIDC = useCallback(
    () => {
      auth.signIn("oidc").then(() => {
        dispatch({ type: SignInAction.verificationReceived });
      });
      dispatch({ type: SignInAction.submitOIDC });
    },
    [auth]
  );
  
  const cancel = useCallback(() => {
    dispatch({ type: SignInAction.cancel });
  }, []);

  return {
    step: state.step,
    email: state.email,
    submitEmail,
    submitOIDC,
    cancel
  };
}


export function SignInModalContainer() {
  const qs = new URLSearchParams(location.search);
  const { step, submitEmail, submitOIDC, cancel, email } = useSignIn();
  const redirectUrl = qs.get("sign_in_destination_url") || "/";

  const auth = useContext(AuthContext);

  useEffect(
    () => {
      if (step === SignInStep.complete) {
        window.location = redirectUrl;
      }
    },
    [step, redirectUrl]
  );

  return (
    <SignInModal disableFullscreen>
      {step === SignInStep.submit ? (
        auth.use_oidc ? (
          <SubmitOIDC onSubmitOIDC={submitOIDC} />
        ) : (
          <SubmitEmail
            onSubmitEmail={submitEmail}
            initialEmail={email}
            signInReason={qs.get("sign_in_reason")}
            termsUrl={configs.link("terms_of_use", TERMS)}
            showTerms={configs.feature("show_terms")}
            privacyUrl={configs.link("privacy_notice", PRIVACY)}
            showPrivacy={configs.feature("show_privacy")}
          />
        )
      ) : (
        <WaitForVerification
          onCancel={cancel}
          email={email}
          showNewsletterSignup={configs.feature("show_newsletter_signup")}
        />
      )}
    </SignInModal>
  );
}
