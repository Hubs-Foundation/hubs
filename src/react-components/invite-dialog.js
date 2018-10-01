import React, { Component } from "react";
import PropTypes from "prop-types";
import copy from "copy-to-clipboard";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/invite-dialog.scss";

function pad(num, size) {
  let s = `${num}`;
  while (s.length < size) s = `0${s}`;
  return s;
}

export default class InviteDialog extends Component {
  static propTypes = {
    entryCode: PropTypes.number,
    dialogType: PropTypes.string,
    onClose: PropTypes.func
  };

  state = {
    copyLinkButtonText: "copy"
  };

  copyLinkClicked = link => {
    copy(link);
    this.setState({ copyLinkButtonText: "copied!" });
  };

  render() {
    const { entryCode } = this.props;

    const entryCodeString = pad(entryCode, 6);
    const shareLink = `hub.link/${entryCodeString}`;
    const isHeadsetLink = this.props.dialogType === "headset";

    if (isHeadsetLink) {
      return (
        <div className={styles.dialog}>
          <div className={styles.close} onClick={() => this.props.onClose()}>
            <span>×</span>
          </div>
          <div>
            <FormattedMessage id="invite.in_your_browser" />
          </div>
          <div className={styles.domain}>
            <input type="text" readOnly onFocus={e => e.target.select()} value="hub.link" />
          </div>
          <div>
            <FormattedMessage id="invite.and_enter_code" />
          </div>
          <div className={styles.code}>
            {entryCodeString.split("").map((d, i) => (
              <div className={styles.digit} key={`link_code_${i}`}>
                {d}
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.dialog}>
          <div className={styles.attachPoint} />
          <div className={styles.close} onClick={() => this.props.onClose()}>
            <span>×</span>
          </div>
          <div className={styles.header}>
            <FormattedMessage id="invite.entry_code" />
          </div>
          <div>
            <FormattedMessage id="invite.join_at" />
            <a href="https://hub.link" target="_blank" rel="noopener noreferrer">
              hub.link
            </a>
          </div>
          <div className={styles.code}>
            {entryCodeString.split("").map((d, i) => (
              <div className={styles.digit} key={`link_code_${i}`}>
                {d}
              </div>
            ))}
          </div>
          <div className={styles.header} style={{ marginTop: "16px" }}>
            <FormattedMessage id="invite.direct_link" />
          </div>
          <div>
            <FormattedMessage id="invite.enter_in_browser" />
          </div>
          <div className={styles.domain}>
            <input type="text" readOnly onFocus={e => e.target.select()} value={shareLink} />
          </div>
          <button className={styles.copyLinkButton} onClick={this.copyLinkClicked.bind(this, "https://" + shareLink)}>
            <span>{this.state.copyLinkButtonText}</span>
          </button>
        </div>
      );
    }
  }
}
