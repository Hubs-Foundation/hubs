import React from "react";
import PropTypes from "prop-types";
import styles from "./OAuthScreen.scss";
import { Modal } from "../modal/Modal";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import { Button } from "../input/Button";
import { LegalMessage } from "./LegalMessage";

const providerLabel = {
  discord: "Discord",
  slack: "Slack"
};
export function OAuthScreen({ provider, redirectUrl, termsUrl, privacyUrl, ...rest }) {
  return (
    <div className={styles.oauthScreen} {...rest}>
      <Modal title={<FormattedMessage id="oauth-screen.title" defaultMessage="Sign In To Continue" />}>
        <Column center padding>
          <p>
            <FormattedMessage
              id="oauth-screen.description"
              defaultMessage="You'll need to sign in to {provider} to access this room."
              values={{ provider: providerLabel[provider] }}
            />
          </p>
          <p>
            <FormattedMessage
              id="oauth-screen.email-reason"
              defaultMessage="We'll ask for access to your e-mail address so you can skip signing in next time."
            />
          </p>
          <p>
            <small>
              <LegalMessage termsUrl={termsUrl} privacyUrl={privacyUrl} />
            </small>
          </p>
          <Button as="a" href={redirectUrl} preset={provider === "discord" ? "accent5" : "accent4"}>
            <FormattedMessage
              id="oauth-screen.sign-in-button"
              defaultMessage="Sign Into {provider}"
              values={{ provider: providerLabel[provider] }}
            />
          </Button>
        </Column>
      </Modal>
    </div>
  );
}

OAuthScreen.propTypes = {
  provider: PropTypes.string.isRequired,
  redirectUrl: PropTypes.string.isRequired,
  termsUrl: PropTypes.string,
  privacyUrl: PropTypes.string
};
