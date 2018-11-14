import React, { Component } from "react";
import PropTypes from "prop-types";

import styles from "../assets/stylesheets/sign-in-dialog.scss";
import DialogContainer from "./dialog-container";

export default class SignInDialog extends Component {
  static propTypes = {
    authStarted: PropTypes.bool,
    authComplete: PropTypes.bool,
    onSignIn: PropTypes.func,
    onContinue: PropTypes.func,
    message: PropTypes.string,
    continueText: PropTypes.string
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
        <p>
          Email sent!<br />
          Waiting for you to click the link in the email...
        </p>
      );
    } else if (this.props.authComplete) {
      contents = (
        <div className={styles.signInComplete}>
          <p>{this.props.message}</p>
          <button onClick={this.props.onContinue} className={styles.continueButton}>
            {this.props.continueText}
          </button>
        </div>
      );
    } else {
      contents = (
        <form onSubmit={this.onSubmit} className={styles.signInForm}>
          <span>{this.props.message}</span>
          <br />
          <input
            name="email"
            type="email"
            required
            placeholder="Your email address"
            value={this.state.email}
            onChange={e => this.setState({ email: e.target.value })}
            className={styles.emailField}
          />
          <button type="submit" className={styles.nextButton}>
            next
          </button>
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
