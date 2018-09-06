import React, { Component } from "react";
import PropTypes from "prop-types";
import LinkDialog from "./link-dialog.js";
import SlackDialog from "./slack-dialog.js";
import CreateObjectDialog from "./create-object-dialog.js";
import CreateRoomDialog from "./create-room-dialog.js";
import DialogContainer from "./dialog-container.js";
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
    onClose: PropTypes.func,
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
      this.props.onClose();
    }
  }

  onContainerClicked = e => {
    if (e.currentTarget === e.target) {
      this.props.onClose();
    }
  };

  render() {
    if (!this.props.dialogType) {
      return <div />;
    }

    switch (this.props.dialogType) {
      case InfoDialog.dialogTypes.slack:
        return <SlackDialog onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.email_submitted:
        return (
          <DialogContainer onClose={this.props.onClose}>
            Great! Please check your e-mail to confirm your subscription.
          </DialogContainer>
        );
      case InfoDialog.dialogTypes.invite:
        return <InviteDialog onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.safari:
        return <SafariDialog onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.create_object:
        return <CreateObjectDialog onCreateObject={this.props.onCreateObject} onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.custom_scene:
        return <CreateRoomDialog onCustomScene={this.props.onCustomScene} onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.updates:
        return <UpdatesDialog onSubmittedEmail={this.props.onSubmittedEmail} onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.report:
        return <ReportDialog onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.help:
        return <HelpDialog onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.webvr_recommend:
        return <WebVRRecommendDialog onClose={this.props.onClose} />;
      case InfoDialog.dialogTypes.link:
        return <LinkDialog linkCode={this.props.linkCode} onClose={this.props.onClose} />;
    }
  }
}
