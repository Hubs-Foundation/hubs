import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import { AudioContext } from "../AudioContext";

export default class ReportDialog extends Component {
  render() {
    return (
      <AudioContext.Consumer>
        {audio => (
          <DialogContainer title="Report an Issue" {...this.props}>
            <span>
              <p>Need to report a problem?</p>
              <p>
                You can file a{" "}
                <a
                  href="https://github.com/mozilla/hubs/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={audio.onMouseEnter}
                  onMouseLeave={audio.onMouseLeave}
                >
                  GitHub Issue
                </a>{" "}
                or e-mail us for support at{" "}
                <a href="mailto:hubs@mozilla.com" onMouseEnter={audio.onMouseEnter} onMouseLeave={audio.onMouseLeave}>
                  hubs@mozilla.com
                </a>
                .
              </p>
              <p>
                You can also find us in{" "}
                <a
                  href="https://webvr.slack.com/messages/social"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={audio.onMouseEnter}
                  onMouseLeave={audio.onMouseLeave}
                >
                  #social
                </a>{" "}
                on the{" "}
                <a
                  href="https://webvr-slack.herokuapp.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={audio.onMouseEnter}
                  onMouseLeave={audio.onMouseLeave}
                >
                  WebVR Slack
                </a>
                .
              </p>
            </span>
          </DialogContainer>
        )}
      </AudioContext.Consumer>
    );
  }
}
