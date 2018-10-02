import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import formurlencoded from "form-urlencoded";
import DialogContainer from "./dialog-container.js";
import { AudioContext } from "../AudioContext";

export default class UpdatesDialog extends Component {
  static propTypes = {
    onSubmittedEmail: PropTypes.func
  };

  state = {
    mailingListEmail: "",
    mailingListPrivacy: false
  };

  render() {
    const { onSubmittedEmail, ...other } = this.props;
    const signUpForMailingList = async e => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.state.mailingListPrivacy) return;

      const url = "https://www.mozilla.org/en-US/newsletter/";

      const payload = {
        email: this.state.mailingListEmail,
        newsletters: "hubs",
        privacy: true,
        fmt: "H",
        source_url: document.location.href
      };

      await fetch(url, {
        body: formurlencoded(payload),
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" }
      }).then(onSubmittedEmail);
    };

    return (
      <DialogContainer {...other}>
        <AudioContext.Consumer>
          {audio => (
            <span>
              <p>Sign up to get updates about new features in Hubs.</p>
              <form onSubmit={signUpForMailingList}>
                <div className="mailing-list-form">
                  <input
                    type="email"
                    value={this.state.mailingListEmail}
                    onChange={e => this.setState({ mailingListEmail: e.target.value })}
                    className="mailing-list-form__email_field"
                    required
                    placeholder="Your email here"
                    onMouseEnter={audio.onMouseEnter}
                    onMouseLeave={audio.onMouseLeave}
                  />
                  <label className="mailing-list-form__privacy">
                    <input
                      className="mailing-list-form__privacy_checkbox"
                      type="checkbox"
                      required
                      value={this.state.mailingListPrivacy}
                      onChange={e => this.setState({ mailingListPrivacy: e.target.checked })}
                      onMouseEnter={audio.onMouseEnter}
                      onMouseLeave={audio.onMouseLeave}
                    />
                    <span className="mailing-list-form__privacy_label">
                      <FormattedMessage id="mailing_list.privacy_label" />{" "}
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://www.mozilla.org/en-US/privacy/"
                        onMouseEnter={audio.onMouseEnter}
                        onMouseLeave={audio.onMouseLeave}
                      >
                        <FormattedMessage id="mailing_list.privacy_link" />
                      </a>
                    </span>
                  </label>
                  <input
                    className="mailing-list-form__submit"
                    type="submit"
                    value="Sign Up Now"
                    onMouseEnter={audio.onMouseEnter}
                    onMouseLeave={audio.onMouseLeave}
                  />
                </div>
              </form>
            </span>
          )}
        </AudioContext.Consumer>
      </DialogContainer>
    );
  }
}
