import React, { Component } from "react";

export default class ReportDialog extends Component {
  render() {
    return (
      <span>
        <p>Need to report a problem?</p>
        <p>
          You can file a{" "}
          <a href="https://github.com/mozilla/hubs/issues" target="_blank" rel="noopener noreferrer">
            GitHub Issue
          </a>{" "}
          or e-mail us for support at <a href="mailto:hubs@mozilla.com">hubs@mozilla.com</a>.
        </p>
        <p>
          You can also find us in{" "}
          <a href="https://webvr.slack.com/messages/social" target="_blank" rel="noopener noreferrer">
            #social
          </a>{" "}
          on the{" "}
          <a href="https://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
            WebVR Slack
          </a>.
        </p>
      </span>
    );
  }
}
