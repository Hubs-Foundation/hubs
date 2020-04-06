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
              Hubs community
            </a>{" "}
            on Discord.
            <br />
          </p>
          <p>VR meetups every Friday at 11:30AM PDT!</p>
          <p>
            You can also follow us on Twitter at{" "}
            <a href="https://twitter.com/mozillareality" target="_blank" rel="noopener noreferrer">
              @mozillareality
            </a>.
          </p>
          <p>
            You can also subscribe to our{" "}
            <a
              href="https://mozilla.us19.list-manage.com/subscribe/post?u=a97038e0879516f7b8300d67f&amp;id=ebf17d04e4"
              target="_blank"
              rel="noopener noreferrer"
            >
              mailing list
            </a>.
          </p>
        </span>
      </DialogContainer>
    );
  }
}
