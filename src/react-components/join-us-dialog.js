import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";

export default class JoinUsDialog extends Component {
  render() {
    return (
      <DialogContainer title="Join Us" {...this.props}>
        <span>
          <p>
            Join us in the{" "}
            <a href="https://discord.gg/XzrGUY8" target="_blank" rel="noopener noreferrer">
              Hubs community
            </a>{" "}
            on Discord.
            <br />
          </p>
          <p>VR meetups every Friday at noon PDT!</p>
          <p>
            You can also follow us on Twitter at{" "}
            <a href="https://twitter.com/mozillareality" target="_blank" rel="noopener noreferrer">
              @mozillareality
            </a>.
          </p>
        </span>
      </DialogContainer>
    );
  }
}
