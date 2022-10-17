import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";
import { SignInModal, SignInStep, SubmitEmail, SubmitOIDC, WaitForVerification, SignInComplete } from "./SignInModal";
import { TERMS, PRIVACY } from "../../constants";

// TODO: Migrate to use AuthContext
export function RoomSignInModalContainer({ onClose, step, onSignIn, message, onContinue }) {
  const [cachedEmail, setCachedEmail] = useState();

  // Can't use `useContext(AuthContext)` unless component is wrapped in an AuthContext element
  const auth = configs.APP_CONFIG.auth;

  return (
    <SignInModal onClose={onClose} closeable>
      {step === SignInStep.submit && (
        auth.use_oidc
        ? <SubmitOIDC 
            onSubmitOIDC={() => onSignIn("oidc")} 
          />
        : <SubmitEmail
            onSubmitEmail={email => {
              setCachedEmail(email);
              onSignIn(email);
            }}
            initialEmail={cachedEmail}
            termsUrl={configs.link("terms_of_use", TERMS)}
            showTerms={configs.feature("show_terms")}
            privacyUrl={configs.link("privacy_notice", PRIVACY)}
            showPrivacy={configs.feature("show_privacy")}
            message={message}
          />
      )}
      {step === SignInStep.waitForVerification && (
        <WaitForVerification
          onCancel={onClose}
          email={cachedEmail}
          showNewsletterSignup={configs.feature("show_newsletter_signup")}
        />
      )}
      {step === SignInStep.complete && <SignInComplete message={message} onContinue={onContinue} />}
    </SignInModal>
  );
}

RoomSignInModalContainer.propTypes = {
  onClose: PropTypes.func,
  onSignIn: PropTypes.func,
  step: PropTypes.string,
  message: PropTypes.object,
  onContinue: PropTypes.func
};
