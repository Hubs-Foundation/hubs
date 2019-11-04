import React, { Component } from "react";

import { messages } from "../utils/i18n";
import DialogContainer from "./dialog-container.js";

export default class SafariMicDialog extends Component {
  render() {
    return (
      <DialogContainer title="Microphone Access Required" {...this.props}>
        <div>
          <div>
            {messages["app-name"]} requires microphone permissions in Safari. <br />
            Please reload and allow microphone access to continue.
          </div>
          <div className="invite-form">
            <div className="invite-form__buttons">
              <button className="invite-form__action-button" onClick={() => location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
