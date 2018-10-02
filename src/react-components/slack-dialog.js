import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import { AudioContext } from "../AudioContext";

export default class SlackDialog extends Component {
  render() {
    return (
      <DialogContainer title="Get in Touch" {...this.props}>
        <AudioContext.Consumer>
          {audio => (
            <span>
              <p>Want to join the conversation?</p>
              <p>
                Join us on the{" "}
                <a
                  href="https://webvr-slack.herokuapp.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={audio.onMouseEnter}
                  onMouseLeave={audio.onMouseLeave}
                >
                  WebVR Slack
                </a>{" "}
                in the{" "}
                <a
                  href="https://webvr.slack.com/messages/social"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={audio.onMouseEnter}
                  onMouseLeave={audio.onMouseLeave}
                >
                  #social
                </a>{" "}
                channel.
                <br />
                VR meetups every Friday at noon PDT!
              </p>
              <p>
                Or, tweet at{" "}
                <a
                  href="https://twitter.com/mozillareality"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={audio.onMouseEnter}
                  onMouseLeave={audio.onMouseLeave}
                >
                  @mozillareality
                </a>{" "}
                on Twitter.
              </p>
            </span>
          )}
        </AudioContext.Consumer>
      </DialogContainer>
    );
  }
}
