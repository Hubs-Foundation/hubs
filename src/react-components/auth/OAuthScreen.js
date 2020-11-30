import React from "react";
import PropTypes from "prop-types";
import styles from "./OAuthScreen.scss";
import { Modal } from "../modal/Modal";
import { Column } from "../layout/Column";
import { defineMessages, useIntl } from "react-intl";
import { Button } from "../input/Button";

const providerLabel = {
  discord: "Discord",
  slack: "Slack"
};

const messages = defineMessages({
  discord: {
    id: "oauth-dialog.sign-in.discord",
    defaultMessage: "Sign in to Discord"
  },
  slack: {
    id: "oauth-dialog.sign-in.slack",
    defaultMessage: "Sign in to Slack"
  }
});

export function OAuthScreen({ provider, redirectUrl, showTerms, termsUrl, showPrivacy, privacyUrl, ...rest }) {
  const intl = useIntl();

  return (
    <div className={styles.oauthScreen} {...rest}>
      <Modal title="Sign In To Continue">
        <Column center padding>
          <p>You&apos;ll need to sign in to {providerLabel[provider]} to access this room.</p>
          <br />
          <p>We&apos;ll ask for access to your e-mail address so you can skip signing in next time.</p>
          {(showTerms || showPrivacy) && (
            <small>
              By proceeding, you agree to the{" "}
              {showTerms && (
                <>
                  <a rel="noopener noreferrer" target="_blank" href={termsUrl}>
                    terms of use
                  </a>{" "}
                </>
              )}
              {showTerms && showPrivacy && "and "}
              {showPrivacy && (
                <a rel="noopener noreferrer" target="_blank" href={privacyUrl}>
                  privacy notice
                </a>
              )}.
            </small>
          )}
          <Button as="a" href={redirectUrl} preset={provider === "discord" ? "purple" : "blue"}>
            {intl.formatMessage(messages[provider])}
          </Button>
        </Column>
      </Modal>
    </div>
  );
}

OAuthScreen.propTypes = {
  provider: PropTypes.string.isRequired,
  redirectUrl: PropTypes.string.isRequired,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  showPrivacy: PropTypes.bool,
  privacyUrl: PropTypes.string
};
