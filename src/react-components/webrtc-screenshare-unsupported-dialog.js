import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";

export default class WebRTCScreenshareUnsupportedDialog extends Component {
  render() {
    return (
      <DialogContainer title="Share Screen" {...this.props}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p>
            Your browser doesn&apos;t seem to support WebRTC screen sharing.
            <br />
            To share your screen in Hubs, you can use Firefox.
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
            To test WebRTC screen sharing in your browser, see this&nbsp;
            <a
              href="https://www.webrtc-experiment.com/screen-sharing/#5591174797993739"
              target="_blank"
              rel="noopener noreferrer"
            >
              WebRTC experiment
            </a>.
          </p>
        </div>
      </DialogContainer>
    );
  }
}
