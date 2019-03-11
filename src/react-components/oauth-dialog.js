import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons/faDiscord";
import DialogContainer from "./dialog-container.js";

export default class OAuthDialog extends Component {
  static propTypes = {
    oauthInfo: PropTypes.array
  };
  render() {
    return (
      <DialogContainer title="Sign In" {...this.props}>
        <div>
          <div>You&apos;ll need to sign in to access this hub.</div>
          <div>We&apos;ll ask for access to your e-mail address so you can skip sign in next time.</div>
          <p>
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
            <div className="invite-form__buttons">
              {this.props.oauthInfo.map(oauthInfo => (
                <a href={oauthInfo.url} key={oauthInfo.type}>
                  <FontAwesomeIcon icon={faDiscord} />
                  Sign in with <span style={{textTransform: "capitalize"}}>{oauthInfo.type}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
