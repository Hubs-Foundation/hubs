import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/oauth-dialog.scss";

export default class OAuthDialog extends Component {
  static propTypes = {
    oauthInfo: PropTypes.array
  };
  render() {
    return (
      <DialogContainer title="Sign In" {...this.props}>
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
          <div className="invite-form">
            <div className={`invite-form__buttons ${styles.oauthButtons}`}>
              {this.props.oauthInfo.map(oauthInfo => (
                <a href={oauthInfo.url} key={oauthInfo.type} className={styles.oauthButton}>
                  Sign in with&nbsp;<span className={styles.oauthTypeName}>{oauthInfo.type}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
