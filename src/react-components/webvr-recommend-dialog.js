import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

export default class WebVRRecommendDialog extends Component {
  render() {
    return (
      <DialogContainer title="Enter in VR" {...this.props}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p>To enter with Oculus or SteamVR, you can use Firefox.</p>
          <WithHoverSound>
            <a
              className="info-dialog--action-button"
              href="https://www.mozilla.org/firefox"
              target="_blank"
              rel="noreferrer noopener"
            >
              Download Firefox
            </a>
          </WithHoverSound>
          <p style={{ fontSize: "0.8em" }}>
            For a list of browsers with experimental VR support, visit{" "}
            <WithHoverSound>
              <a href="https://webvr.rocks" target="_blank" rel="noopener noreferrer">
                WebVR Rocks
              </a>
            </WithHoverSound>
          </p>
        </div>
      </DialogContainer>
    );
  }
}
