import React, { Component } from "react";
import PropTypes from "prop-types";
import LinkDialog from "./link-dialog.js";
import SlackDialog from "./slack-dialog.js";
import CreateObjectDialog from "./create-object-dialog.js";
import CreateRoomDialog from "./create-room-dialog.js";
import InviteDialog from "./invite-dialog.js";
import SafariDialog from "./safari-dialog.js";
import UpdatesDialog from "./updates-dialog.js";
import ReportDialog from "./report-dialog.js";
import HelpDialog from "./help-dialog.js";
import WebVRRecommendDialog from "./webvr-recommend-dialog.js";

// TODO i18n

export default class InfoDialog extends Component {
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
    create_object: Symbol("create_object"),
    custom_scene: Symbol("custom_scene")
  };
  static propTypes = {
    dialogType: PropTypes.oneOf(Object.values(InfoDialog.dialogTypes)),
    onCloseDialog: PropTypes.func,
    onSubmittedEmail: PropTypes.func,
    onCreateObject: PropTypes.func,
    onCustomScene: PropTypes.func,
    linkCode: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onContainerClicked = this.onContainerClicked.bind(this);
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(e) {
    if (e.key === "Escape") {
      this.props.onCloseDialog();
    }
  }

  onContainerClicked = e => {
    if (e.currentTarget === e.target) {
      this.props.onCloseDialog();
    }
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
        dialogBody = <SlackDialog />;
        break;
      case InfoDialog.dialogTypes.email_submitted:
        dialogTitle = "";
        dialogBody = "Great! Please check your e-mail to confirm your subscription.";
        break;
      case InfoDialog.dialogTypes.invite:
        dialogTitle = "Invite Others";
        dialogBody = <InviteDialog />;
        break;
      case InfoDialog.dialogTypes.safari:
        dialogTitle = "Open in Safari";
        dialogBody = <SafariDialog />;
        break;
      case InfoDialog.dialogTypes.create_object:
        dialogTitle = "Create Object";
        dialogBody = (
          <CreateObjectDialog onCreateObject={this.props.onCreateObject} onCloseDialog={this.props.onCloseDialog} />
        );
        break;
      case InfoDialog.dialogTypes.custom_scene:
        dialogTitle = "Create a Room";
        dialogBody = (
          <CreateRoomDialog onCustomScene={this.props.onCustomScene} onCloseDialog={this.props.onCloseDialog} />
        );
        break;
      case InfoDialog.dialogTypes.updates:
        dialogTitle = "";
        dialogBody = <UpdatesDialog onSubmittedEmail={this.props.onSubmittedEmail} />;
        break;
      case InfoDialog.dialogTypes.report:
        dialogTitle = "Report an Issue";
        dialogBody = <ReportDialog />;
        break;
      case InfoDialog.dialogTypes.help:
        dialogTitle = "Getting Started";
        dialogBody = <HelpDialog />;
        break;
      case InfoDialog.dialogTypes.webvr_recommend:
        dialogTitle = "Enter in VR";
        dialogBody = <WebVRRecommendDialog />;
        break;
      case InfoDialog.dialogTypes.link:
        dialogTitle = "Open on Headset";
        dialogBody = <LinkDialog linkCode={this.props.linkCode} />;
        break;
    }

    return (
      <div className="dialog-overlay">
        <div className="dialog" onClick={this.onContainerClicked}>
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
