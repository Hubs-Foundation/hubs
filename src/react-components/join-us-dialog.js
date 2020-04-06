import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";

export default class JoinUsDialog extends Component {
  render() {
    return (
      <DialogContainer title="Join Us" {...this.props}>
        <span>
          <p>
            Join us in the{" "}
            <a href="https://discord.gg/wHmY4nd" target="_blank" rel="noopener noreferrer">
              Hubs community Discord server
            </a>
            .{"\n"} We host meetups every Friday!
          </p>
          <p>
            You can also follow us on Twitter at{" "}
            <a href="https://twitter.com/MozillaHubs" target="_blank" rel="noopener noreferrer">
              @MozillaHubs
            </a>.
          </p>
          <p>
            Prefer to stay up to date by email?{"\n"}
            <a href="https://eepurl.com/gX_fH9" target="_blank" rel="noopener noreferrer">
              Subscribe to the newsletter.
            </a>
          </p>
        </span>
      </DialogContainer>
    );
  }
}
