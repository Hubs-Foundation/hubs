import React, { Component, useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import loginButton from "../assets/images/login-button.png";
import loginButtonHover from "../assets/images/login-button-hover.png";

import loginButtonWebp from "../assets/images/login-button.webp";
import loginButtonHoverWebp from "../assets/images/login-button-hover.webp";


import configs from "../utils/configs";
import IfFeature from "./if-feature";
import styles from "../assets/stylesheets/sign-in-dialog.scss";

import DialogContainer from "./dialog-container";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";

const LoginButton = (otherProps) => {
  const [isShown, setIsShown] = useState(false);

  return (
    <button
      onMouseEnter={() => setIsShown(true)}
      onMouseLeave={() => setIsShown(false)}

      style={{
        border: "none",
        background: "none",
        padding: "0",
        margin: "0",
        cursor: "pointer"
      }}
      {...otherProps}
    >
      {isShown ? <picture >
        <source srcSet={loginButtonHoverWebp} type="image/webp" />

        <img

          style={{
            maxWidth: "120px"
          }}
          src={loginButtonHover}
        />
      </picture> : <picture >
          <source srcSet={loginButtonWebp} type="image/webp" />

          <img

            style={{
              maxWidth: "120px"
            }}
            src={loginButton}
          />
        </picture>}
    </button>
  );
};


export default class SignInDialog extends Component {
  static propTypes = {
    authStarted: PropTypes.bool,
    authComplete: PropTypes.bool,
    onSignIn: PropTypes.func,
    onContinue: PropTypes.func,
    message: PropTypes.string,
    continueText: PropTypes.string,
    closable: PropTypes.bool
  };

  static defaultProps = {
    closable: true
  };

  state = {
    email: ""
  };

  onSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onSignIn(this.state.email);
  };

  render() {
    let contents;
    if (this.props.authStarted) {
      contents = (
        <div
          style={{
            color: "#98A600"
          }}
        >
          <p>
            <FormattedMessage className="preformatted" id="sign-in.auth-started" value={{ email: this.state.email }} />
          </p>
        </div>
      );
    } else if (this.props.authComplete) {
      contents = (
        <div
          className={styles.signInComplete}
          style={{
            color: "#98A600"
          }}
        >
          <p>{this.props.message}</p>
          <button onClick={this.props.onContinue} className={styles.continueButton}>
            {this.props.continueText}
          </button>
        </div>
      );
    } else {
      contents = (
        <form
          onSubmit={this.onSubmit}
          className={styles.signInForm}
          style={{
            color: "#667000"
          }}
        >
          <span
            style={{
              fontSize: "25px",
              textTransform: "uppercase",
              borderRadius: "none"
            }}
          >
            {this.props.message}
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder="your email address"
            value={this.state.email}
            onFocus={e => handleTextFieldFocus(e.target)}
            onBlur={() => handleTextFieldBlur()}
            onChange={e => this.setState({ email: e.target.value })}
            className={styles.emailField}
            style={{
              border: "1px solid #667000",
              background: "transparent",
              color: "#667000",
              textAlign: "center"
            }}
          />
          {(configs.feature("show_terms") || configs.feature("show_privacy")) && (
            <p className={styles.terms}>
              By proceeding, you agree to the{" "}
              <IfFeature name="show_terms">
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  style={{
                    color: "#667000"
                  }}
                  href={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
                >
                  terms of use
                </a>{" "}
              </IfFeature>
              {configs.feature("show_terms") && configs.feature("show_privacy") && "and "}
              <IfFeature name="show_privacy">
                <a
                  rel="noopener noreferrer"
                  target="_blank"

                  style={{
                    color: "#667000"
                  }}
                  href={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
                >
                  privacy notice
                </a>
              </IfFeature>.
            </p>
          )}
          <LoginButton type="submit" />
        </form>
      );
    }

    return (
      <DialogContainer title="Sign In" {...this.props}>
        {contents}
      </DialogContainer>
    );
  }
}
