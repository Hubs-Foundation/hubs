import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import DialogContainer from "./dialog-container.js";
import { WithHoverSound } from "./wrap-with-audio";

export default class HelpDialog extends Component {
  render() {
    return (
      <DialogContainer title="Getting Started" {...this.props}>
        <div className="info-dialog__help">
          <p style={{ textAlign: "center" }}>
            Join the Hubs community on{" "}
            <WithHoverSound>
              <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/XzrGUY8">
                Discord
              </a>
            </WithHoverSound>
            !
          </p>
          <p>When in a room, other avatars can see and hear you.</p>
          <p>
            Use your controller&apos;s action button to teleport from place to place. If it has a grip, use it to pick
            up objects.
          </p>
          <p>
            In VR, <b>look up</b> to find your menu.
          </p>
          <p>
            The <b>Mic Toggle</b> mutes your mic.
          </p>
          <p>
            The <b>Pause Toggle</b> pauses all other avatars and lets you block others or pin or remove objects.
          </p>
          <p className="dialog__box__contents__links">
            <WithHoverSound>
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
                <FormattedMessage id="profile.terms_of_use" />
              </a>
            </WithHoverSound>
            <WithHoverSound>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
              >
                <FormattedMessage id="profile.privacy_notice" />
              </a>
            </WithHoverSound>
            <WithHoverSound>
              <a target="_blank" rel="noopener noreferrer" href="/?report">
                <FormattedMessage id="help.report_issue" />
              </a>
            </WithHoverSound>
          </p>
        </div>
      </DialogContainer>
    );
  }
}
