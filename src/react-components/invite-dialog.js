import React, { Component } from "react";
import copy from "copy-to-clipboard";

export default class InviteDialog extends Component {
  state = {
    copyLinkButtonText: "copy"
  };

  constructor(props) {
    super(props);
    const loc = document.location;
    this.shareLink = `${loc.protocol}//${loc.host}${loc.pathname}`;
  }

  copyLinkClicked = link => {
    copy(link);
    this.setState({ copyLinkButtonText: "copied!" });
  };

  shareLinkClicked = () => {
    navigator.share({
      title: document.title,
      url: this.shareLink
    });
  };

  render() {
    return (
      <div>
        <div>Just share the link and they&apos;ll join you:</div>
        <div className="invite-form">
          <input
            type="text"
            readOnly
            onFocus={e => e.target.select()}
            value={this.shareLink}
            className="invite-form__link_field"
          />
          <div className="invite-form__buttons">
            {navigator.share && (
              <button className="invite-form__action-button" onClick={this.shareLinkClicked}>
                <span>share</span>
              </button>
            )}
            <button className="invite-form__action-button" onClick={this.copyLinkClicked.bind(this, this.shareLink)}>
              <span>{this.state.copyLinkButtonText}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
