import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";

export default class WebVRRecommendDialog extends Component {
  render() {
    return (
      <DialogContainer title="Enter in VR" {...this.props}>
        <div>
          <p>To enter Hubs with Oculus or SteamVR, you can use Firefox.</p>
          <a className="info-dialog--action-button" href="https://www.mozilla.org/firefox">
            Download Firefox
          </a>
          <p style={{ fontSize: "0.8em" }}>
            For a full list of browsers with experimental VR support, visit{" "}
            <a href="https://webvr.rocks" target="_blank" rel="noopener noreferrer">
              WebVR Rocks
            </a>.
          </p>
        </div>
      </DialogContainer>
    );
  }
}
