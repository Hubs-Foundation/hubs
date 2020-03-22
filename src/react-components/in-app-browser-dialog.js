import React, { Component } from "react";
import copy from "copy-to-clipboard";
import { detectOS } from "detect-browser";

import { messages } from "../utils/i18n";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

export default class InAppBrowserDialog extends Component {
  state = {
    copyLinkButtonText: "copy"
  };

  copyLinkClicked = link => {
    copy(link);
    this.setState({ copyLinkButtonText: "copied!" });
  };

  render() {
    const onCopyClicked = this.copyLinkClicked.bind(this, document.location);
    const detectedOS = detectOS(navigator.userAgent);
    return (
      <DialogContainer title="Open in Browser" {...this.props}>
        <div>
          <div>
            {messages["app-name"]} does not support your current browser.<br />
            Copy and paste this link directly into {detectedOS === "iOS" ? "Safari" : "Chrome or Firefox"}.
          </div>
          <div className="invite-form">
            <input
              type="text"
              readOnly
              onFocus={e => e.target.select()}
              value={document.location}
              className="invite-form__link_field"
            />
            <div className="invite-form__buttons">
              <WithHoverSound>
                <button className="invite-form__action-button" onClick={onCopyClicked}>
                  <span>{this.state.copyLinkButtonText}</span>
                </button>
              </WithHoverSound>
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
