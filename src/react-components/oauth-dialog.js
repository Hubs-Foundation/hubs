import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import { FormattedMessage } from "react-intl";
import styles from "../assets/stylesheets/oauth-dialog.scss";
import classNames from "classnames";

export default class OAuthDialog extends Component {
  static propTypes = {
    oauthInfo: PropTypes.array
  };
  renderSignInDisclaimer(type) {
    return (
      <div>
        <div>
          You&apos;ll need to sign in to <span className={styles.oauthTypeName}>{type}</span> to access this room.
        </div>
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
    return (
      <div className={styles.twitterMessage}>
        <FormattedMessage id="oauth-dialog.message.twitter" />
      </div>
    );
  }

  render() {
    const info = this.props.oauthInfo && this.props.oauthInfo[0];
    const closable = info && info.type === "twitter"; // NOTE: for now, allow closing dialog if doing Twitter sign in (currently just for sharing)

    return (
      <DialogContainer title="" closable={closable} {...this.props}>
        <div>
          {info && (info.type === "twitter" ? this.renderTweetDisclaimer() : this.renderSignInDisclaimer(info.type))}
          <div className="invite-form">
            <div className={`invite-form__buttons ${styles.oauthButtons}`}>
              {info ? (
                <a
                  href={info.url}
                  key={info.type}
                  className={classNames({
                    [styles.oauthButton]: true,
                    [styles.oauthTwitterButton]: info.type === "twitter",
                    [styles.oauthDiscordButton]: info.type === "discord"
                  })}
                >
                  <FormattedMessage id={`oauth-dialog.sign-in.${info.type}`} />
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
