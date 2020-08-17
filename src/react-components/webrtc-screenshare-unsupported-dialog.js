import React, { Component } from "react";

import { getMessages } from "../utils/i18n";
import DialogContainer from "./dialog-container.js";

export default class WebRTCScreenshareUnsupportedDialog extends Component {
  render() {
    return (
      <DialogContainer title="Share Screen" {...this.props}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p>
            Your browser doesn&apos;t seem to support screen sharing.
            <br />
            To share your screen in ${getMessages()["app-name"]}, you can use Firefox.
          </p>
          <a
            className="info-dialog--action-button"
            target="_blank"
            rel="noreferrer noopener"
            href="https://www.mozilla.org/firefox"
          >
            Download Firefox
          </a>
          <p style={{ fontSize: "0.8em" }}>
            You can try&nbsp;
            <a
              href="https://www.webrtc-experiment.com/screen-sharing/#5591174797993739"
              target="_blank"
              rel="noopener noreferrer"
            >
              testing WebRTC screen sharing
            </a>&nbsp;in your browser.
          </p>
        </div>
      </DialogContainer>
    );
  }
}
