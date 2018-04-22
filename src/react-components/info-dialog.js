import React, { Component } from "react";
import copy from "copy-to-clipboard";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import formurlencoded from "form-urlencoded";

// TODO i18n

class InfoDialog extends Component {
  static dialogTypes = {
    slack: Symbol("slack"),
    email_submitted: Symbol("email_submitted"),
    invite: Symbol("invite"),
    updates: Symbol("updates"),
    report: Symbol("report")
  };
  static propTypes = {
    dialogType: PropTypes.oneOf(Object.values(InfoDialog.dialogTypes)),
    allowEmailSkip: PropTypes.bool,
    darkendBackground: PropTypes.bool,
    onCloseDialog: PropTypes.func,
    onSubmittedEmail: PropTypes.func
  };

  constructor(props) {
    super(props);

    const loc = document.location;
    this.shareLink = `${loc.protocol}//${loc.host}${loc.pathname}`;
  }

  shareLinkClicked = () => {
    navigator.share({
      title: document.title,
      url: this.shareLink
    });
  };

  copyLinkClicked = () => {
    copy(this.shareLink);
    this.setState({ copyLinkButtonText: "Copied!" });
  };

  state = {
    mailingListEmail: "",
    mailingListPrivacy: false,
    copyLinkButtonText: "Copy"
  };

  signUpForMailingList = async e => {
    e.preventDefault();
    e.stopPropagation();

    if (this.state.mailingListEmail.length == 0 && this.props.allowEmailSkip) {
      this.props.onCloseDialog();
      return;
    }

    if (!this.state.mailingListPrivacy) return;

    const url = "https://www.mozilla.org/en-US/newsletter/";

    const payload = {
      email: this.state.mailingListEmail,
      newsletters: "mixed-reality",
      privacy: true,
      fmt: "H",
      source_url: document.location.href
    };

    await fetch(url, {
      body: formurlencoded(payload),
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" }
    }).then(this.props.onSubmittedEmail);
  };

  render() {
    if (!this.props.dialogType) {
      return <div />;
    }

    let dialogTitle = null;
    let dialogBody = null;

    switch (this.props.dialogType) {
      // TODO i18n, FormattedMessage doesn't play nicely with links
      case InfoDialog.dialogTypes.slack:
        dialogTitle = "Get in Touch";
        dialogBody = (
          <span>
            Want to join the conversation?
            <p />
            Join us on the{" "}
            <a href="https://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
              WebVR Slack
            </a>{" "}
            in the #social channel.<br />VR meetups every Friday at noon PST!
            <p /> Or, tweet at{" "}
            <a href="https://twitter.com/mozillareality" target="_blank" rel="noopener noreferrer">
              @mozillareality
            </a>{" "}
            on Twitter.
          </span>
        );
        break;
      case InfoDialog.dialogTypes.email_submitted:
        dialogTitle = "";
        dialogBody = (
          <div>
            <div>Great! Please check your e-mail to confirm your subscription.</div>
            <button className="email-submitted__close-button" onClick={this.props.onCloseDialog}>
              Close
            </button>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.invite:
        dialogTitle = "Invite Others";
        dialogBody = (
          <div>
            <div>Just share the link to have others join you.</div>
            <div className="invite-form">
              <input
                type="text"
                readOnly
                onFocus={e => e.target.select()}
                value={this.shareLink}
                className="invite-form__link_field"
              />
              <div className="invite-form__buttons">
                {navigator.share && (
                  <button className="invite-form__action-button" onClick={this.shareLinkClicked}>
                    <span>Share</span>
                  </button>
                )}
                <button className="invite-form__action-button" onClick={this.copyLinkClicked}>
                  <span>{this.state.copyLinkButtonText}</span>
                </button>
              </div>
            </div>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.updates:
        dialogTitle = "";
        dialogBody = (
          <span>
            Sign up to get updates about Hubs.
            <p />
            <form onSubmit={this.signUpForMailingList}>
              <div className="mailing-list-form">
                <input
                  type="email"
                  value={this.state.mailingListEmail}
                  onChange={e => this.setState({ mailingListEmail: e.target.value })}
                  className="mailing-list-form__email_field"
                  required={!this.props.allowEmailSkip}
                  placeholder="Your email here"
                />
                <label
                  className={classNames({
                    "mailing-list-form__privacy": true,
                    "mailing-list-form__privacy--hidden":
                      this.state.mailingListEmail.length === 0 && this.props.allowEmailSkip
                  })}
                >
                  <input
                    className="mailing-list-form__privacy_checkbox"
                    type="checkbox"
                    required={this.state.mailingListEmail.length > 0}
                    value={this.state.mailingListPrivacy}
                    onChange={e => this.setState({ mailingListPrivacy: e.target.checked })}
                  />
                  <span className="mailing-list-form__privacy_label">
                    <FormattedMessage id="mailing_list.privacy_label" />{" "}
                    <a target="_blank" rel="noopener noreferrer" href="https://www.mozilla.org/en-US/privacy/">
                      <FormattedMessage id="mailing_list.privacy_link" />
                    </a>
                  </span>
                </label>
                <input
                  className="mailing-list-form__submit"
                  type="submit"
                  value={!this.props.allowEmailSkip || this.state.mailingListEmail.length > 0 ? "Sign Up Now" : "Skip"}
                />
              </div>
            </form>
          </span>
        );
        break;
      case InfoDialog.dialogTypes.report:
        dialogTitle = "Report an Issue";
        dialogBody = (
          <span>
            Need to report a problem?
            <p />
            You can file a{" "}
            <a href="https://github.com/mozilla/mr-social-client/issues" target="_blank" rel="noopener noreferrer">
              Github Issue
            </a>{" "}
            or e-mail us for support at <a href="mailto:hubs@mozilla.com">hubs@mozilla.com</a>.
            <p />
            You can also find us in #social on the{" "}
            <a href="http://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
              WebVR Slack
            </a>.
          </span>
        );
        break;
    }

    const dialogClassNames = classNames({ dialog: true, "dialog--darkened-background": this.props.darkendBackground });

    return (
      <div className="dialog-overlay">
        <div className={dialogClassNames}>
          <div className="dialog__box">
            <div className="dialog__box__contents">
              <button className="dialog__box__contents__close" onClick={this.props.onCloseDialog}>
                <span>×</span>
              </button>
              <div className="dialog__box__contents__title">{dialogTitle}</div>
              <div className="dialog__box__contents__body">{dialogBody}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default InfoDialog;
