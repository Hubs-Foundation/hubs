import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";

export default class SignInDialog extends Component {
  static propTypes = {
    authStarted: PropTypes.bool,
    authComplete: PropTypes.bool,
    onSignIn: PropTypes.func,
    message: PropTypes.string
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
      contents = <p>{this.props.message}</p>;
    } else {
      contents = (
        <form onSubmit={this.onSubmit}>
          <span>{this.props.message}</span>
          <br />
          <input
            name="email"
            type="email"
            placeholder="Your email address"
            value={this.state.email}
            onChange={e => this.setState({ email: e.target.value })}
          />
          <button type="submit">Next</button>
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
