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
    onClose: PropTypes.func
  };

  state = {
    linkButtonText: navigator.share ? "share" : "copy"
  };

  linkClicked = link => {
    if (navigator.share) {
      navigator.share({ title: document.title, url: link });
      this.props.onClose();
    } else {
      copy(link);
      this.setState({ linkButtonText: "copied!" });
    }
  };

  render() {
    const { entryCode } = this.props;

    const entryCodeString = pad(entryCode, 6);
    const shareLink = `hub.link/${entryCodeString}`;

    return (
      <div className={styles.dialog}>
        <div className={styles.attachPoint} />
        <div className={styles.close} onClick={() => this.props.onClose()}>
          <span>×</span>
        </div>
        <div>
          <FormattedMessage id="invite.enter_via" />
          <a href="https://hub.link" target="_blank" className={styles.hubLinkLink} rel="noopener noreferrer">
            hub.link
          </a>
          <FormattedMessage id="invite.and_enter_code" />
        </div>
        <div className={styles.code}>
          {entryCodeString.split("").map((d, i) => (
            <div className={styles.digit} key={`link_code_${i}`}>
              {d}
            </div>
          ))}
        </div>
        <div>
          <FormattedMessage id="invite.or_visit" />
        </div>
        <div className={styles.domain}>
          <input type="text" readOnly onFocus={e => e.target.select()} value={shareLink} />
        </div>
        <button className={styles.linkButton} onClick={this.linkClicked.bind(this, "https://" + shareLink)}>
          <span>{this.state.linkButtonText}</span>
        </button>
      </div>
    );
  }
}
