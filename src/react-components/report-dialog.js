import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

export default class ReportDialog extends Component {
  render() {
    return (
      <DialogContainer title="Report an Issue" {...this.props}>
        <span>
          <p>Need to report a problem?</p>
          <p>
            You can file a{" "}
            <WithHoverSound>
              <a href="https://github.com/mozilla/hubs/issues" target="_blank" rel="noopener noreferrer">
                GitHub Issue
              </a>
            </WithHoverSound>
            or e-mail us for support at{" "}
            <WithHoverSound>
              <a href="mailto:hubs@mozilla.com">hubs@mozilla.com</a>
            </WithHoverSound>
          </p>
          <p>
            You can also find us in{" "}
            <WithHoverSound>
              <a href="https://webvr.slack.com/messages/social" target="_blank" rel="noopener noreferrer">
                #social
              </a>
            </WithHoverSound>
            on the{" "}
            <WithHoverSound>
              <a href="https://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
                WebVR Slack
              </a>
            </WithHoverSound>
          </p>
        </span>
      </DialogContainer>
    );
  }
}
