import React, { Component } from "react";
import copy from "copy-to-clipboard";
import classNames from "classnames";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import formurlencoded from "form-urlencoded";
import LinkDialog from "./link-dialog.js";

// TODO i18n

let lastAddMediaUrl = "";

class InfoDialog extends Component {
  static dialogTypes = {
    slack: Symbol("slack"),
    email_submitted: Symbol("email_submitted"),
    invite: Symbol("invite"),
    safari: Symbol("safari"),
    updates: Symbol("updates"),
    report: Symbol("report"),
    help: Symbol("help"),
    link: Symbol("link"),
    webvr_recommend: Symbol("webvr_recommend"),
    add_media: Symbol("add_media")
  };
  static propTypes = {
    dialogType: PropTypes.oneOf(Object.values(InfoDialog.dialogTypes)),
    onCloseDialog: PropTypes.func,
    onSubmittedEmail: PropTypes.func,
    onAddMedia: PropTypes.func,
    linkCode: PropTypes.string
  };

  constructor(props) {
    super(props);

    const loc = document.location;
    this.shareLink = `${loc.protocol}//${loc.host}${loc.pathname}`;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onContainerClicked = this.onContainerClicked.bind(this);
    this.onAddMediaClicked = this.onAddMediaClicked.bind(this);
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
    this.setState({ addMediaUrl: lastAddMediaUrl });
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
    lastAddMediaUrl = this.state.addMediaUrl;
  }

  onKeyDown(e) {
    if (e.key === "Escape") {
      this.props.onCloseDialog();
    }
  }

  onContainerClicked(e) {
    if (e.currentTarget === e.target) {
      this.props.onCloseDialog();
    }
  }

  onAddMediaClicked() {
    this.props.onAddMedia(this.state.addMediaUrl);
    this.props.onCloseDialog();
  }

  shareLinkClicked = () => {
    navigator.share({
      title: document.title,
      url: this.shareLink
    });
  };

  copyLinkClicked = link => {
    copy(link);
    this.setState({ copyLinkButtonText: "Copied!" });
  };

  state = {
    mailingListEmail: "",
    mailingListPrivacy: false,
    copyLinkButtonText: "Copy",
    addMediaUrl: ""
  };

  signUpForMailingList = async e => {
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
        dialogBody = "Great! Please check your e-mail to confirm your subscription.";
        break;
      case InfoDialog.dialogTypes.invite:
        dialogTitle = "Invite Friends";
        dialogBody = (
          <div>
            <div>Just share the link to invite others.</div>
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
                <button
                  className="invite-form__action-button"
                  onClick={this.copyLinkClicked.bind(this, this.shareLink)}
                >
                  <span>{this.state.copyLinkButtonText}</span>
                </button>
              </div>
            </div>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.safari:
        dialogTitle = "Open in Safari";
        dialogBody = (
          <div>
            <div>Hubs does not support your current browser on iOS. Copy and paste this link directly in Safari.</div>
            <div className="invite-form">
              <input
                type="text"
                readOnly
                onFocus={e => e.target.select()}
                value={document.location}
                className="invite-form__link_field"
              />
              <div className="invite-form__buttons">
                <button
                  className="invite-form__action-button"
                  onClick={this.copyLinkClicked.bind(this, document.location)}
                >
                  <span>{this.state.copyLinkButtonText}</span>
                </button>
              </div>
            </div>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.add_media:
        dialogTitle = "Add Media";
        dialogBody = (
          <div>
            <div>Tip: You can paste media urls directly into hubs with ctrl+v</div>
            <form onSubmit={this.onAddMediaClicked}>
              <div className="add-media-form">
                <input
                  type="url"
                  placeholder="Image, Video, or GLTF URL"
                  className="add-media-form__link_field"
                  value={this.state.addMediaUrl}
                  onChange={e => this.setState({ addMediaUrl: e.target.value })}
                  required
                />
                <div className="add-media-form__buttons">
                  <button className="add-media-form__action-button">
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.updates:
        dialogTitle = "";
        dialogBody = (
          <span>
            Sign up to get updates about new features in Hubs.
            <p />
            <form onSubmit={this.signUpForMailingList}>
              <div className="mailing-list-form">
                <input
                  type="email"
                  value={this.state.mailingListEmail}
                  onChange={e => this.setState({ mailingListEmail: e.target.value })}
                  className="mailing-list-form__email_field"
                  required
                  placeholder="Your email here"
                />
                <label className="mailing-list-form__privacy">
                  <input
                    className="mailing-list-form__privacy_checkbox"
                    type="checkbox"
                    required
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
                <input className="mailing-list-form__submit" type="submit" value="Sign Up Now" />
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
            <a href="https://github.com/mozilla/hubs/issues" target="_blank" rel="noopener noreferrer">
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
      case InfoDialog.dialogTypes.help:
        dialogTitle = "Getting Started";
        dialogBody = (
          <div className="info-dialog__help">
            When in a room, other avatars can see and hear you.
            <p />
            Use your controller&apos;s action button to teleport from place to place. If it has a trigger, use it to
            pick up objects.
            <p style={{ textAlign: "center" }}>
              In VR, <b>look up</b> to find your menu:
              <img
                className="info-dialog__help__hud"
                src="../assets/images/help-hud.png"
                srcSet="../assets/images/help-hud@2x.png 2x"
              />
            </p>
            <p>
              The <b>Mic Toggle</b> mutes your mic.
            </p>
            <p>
              The <b>Pause/Resume Toggle</b> pauses all other avatars. You can then block them from having further
              interactions with you.
            </p>
            <p>
              The <b>Bubble Toggle</b> hides avatars that enter your personal space.
            </p>
            <p className="dialog__box__contents__links">
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
                <FormattedMessage id="profile.terms_of_use" />
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
              >
                <FormattedMessage id="profile.privacy_notice" />
              </a>
            </p>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.webvr_recommend:
        dialogTitle = "Enter in VR";
        dialogBody = (
          <div>
            <p>To enter Hubs with Oculus or SteamVR, you can use Firefox.</p>
            <a className="info-dialog--action-button" href="https://www.mozilla.org/firefox">
              Download Firefox
            </a>
            <p style={{ fontSize: "0.8em" }}>
              For a full list of browsers with experimental VR support, visit{" "}
              <a href="https://webvr.rocks" target="_blank" rel="noopener noreferrer">
                WebVR Rocks
              </a>.
            </p>
          </div>
        );
        break;
      case InfoDialog.dialogTypes.link:
        dialogTitle = "Send Link to Device";
        dialogBody = <LinkDialog linkCode={this.props.linkCode} />;
        break;
    }

    const dialogClasses = classNames({
      dialog: true,
      "dialog--tall": this.props.dialogType === InfoDialog.dialogTypes.help
    });

    return (
      <div className="dialog-overlay">
        <div className={dialogClasses} onClick={this.onContainerClicked}>
          <div className="dialog__box">
            <div className="dialog__box__contents">
              <button className="dialog__box__contents__close" onClick={this.props.onCloseDialog}>
                <span>×</span>
              </button>
              <div className="dialog__box__contents__title">{dialogTitle}</div>
              <div className="dialog__box__contents__body">{dialogBody}</div>
              <div className="dialog__box__contents__button-container" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default InfoDialog;
