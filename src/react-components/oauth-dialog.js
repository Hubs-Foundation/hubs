import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/oauth-dialog.scss";

export default class OAuthDialog extends Component {
  static propTypes = {
    oauthInfo: PropTypes.array
  };
  renderSignInDisclaimer() {
    return (
      <div>
        <div>You&apos;ll need to sign in to access this room.</div>
        <br />
        <div>We&apos;ll ask for access to your e-mail address so you can skip signing in next time.</div>
        <p className={styles.privacyNotice}>
          By proceeding, you agree to the{" "}
          <a rel="noopener noreferrer" target="_blank" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
            terms of use
          </a>{" "}
          and{" "}
          <a rel="noopener noreferrer" target="_blank" href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md">
            privacy notice
          </a>.
        </p>
      </div>
    );
  }

  renderTweetDisclaimer() {
    return <div>Sign in to Twitter to compose tweets from within Hubs.</div>;
  }

  render() {
    const info = this.props.oauthInfo && this.props.oauthInfo[0];

    return (
      <DialogContainer title="Sign In" {...this.props}>
        <div>
          {info && (info.type === "twitter" ? this.renderTweetDisclaimer() : this.renderSignInDisclaimer())}
          <div className="invite-form">
            <div className={`invite-form__buttons ${styles.oauthButtons}`}>
              {info ? (
                <a href={info.url} key={info.type} className={styles.oauthButton}>
                  Sign in to&nbsp;<span className={styles.oauthTypeName}>{info.type}</span>
                </a>
              ) : (
                <div className="loader-wrap loader-mid">
                  <div className="loader">
                    <div className="loader-center" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
