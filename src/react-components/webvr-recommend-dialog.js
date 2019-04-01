import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

export default class WebVRRecommendDialog extends Component {
  render() {
    return (
      <DialogContainer title="Enter in VR" {...this.props}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p>To enter Hubs with Oculus or SteamVR, you&apos;ll need to use Firefox 68 Nightly.</p>
          <WithHoverSound>
            <a
              className="info-dialog--action-button"
              href="https://www.mozilla.org/en-US/firefox/channel/desktop/?utm_campaign=blog-nav&utm_medium=referral&utm_source=blog.nightly.mozilla.org#nightly"
              target="_blank"
              rel="noreferrer noopener"
            >
              Download Firefox 68 Nightly
            </a>
          </WithHoverSound>
          <p style={{ fontSize: "0.8em" }}>
            For a full list of browsers with experimental VR support, visit{" "}
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
