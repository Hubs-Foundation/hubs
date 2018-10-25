import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

export default class SlackDialog extends Component {
  render() {
    return (
      <DialogContainer title="Get in Touch" {...this.props}>
        <span>
          <p>Want to join the conversation?</p>
          <p>
            Join us on the{" "}
            <WithHoverSound>
              <a href="https://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
                WebVR Slack
              </a>
            </WithHoverSound>{" "}
            in the{" "}
            <WithHoverSound>
              <a href="https://webvr.slack.com/messages/social" target="_blank" rel="noopener noreferrer">
                #social
              </a>
            </WithHoverSound>{" "}
            channel.
            <br />
            VR meetups every Friday at noon PDT!
          </p>
          <p>
            Or, tweet at{" "}
            <WithHoverSound>
              <a href="https://twitter.com/mozillareality" target="_blank" rel="noopener noreferrer">
                @mozillareality
              </a>
            </WithHoverSound>{" "}
            on Twitter.
          </p>
        </span>
      </DialogContainer>
    );
  }
}
