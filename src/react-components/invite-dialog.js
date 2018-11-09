import React, { Component } from "react";
import PropTypes from "prop-types";
import copy from "copy-to-clipboard";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { share } from "../utils/share";

import { WithHoverSound } from "./wrap-with-audio";
import styles from "../assets/stylesheets/invite-dialog.scss";

function pad(num, size) {
  let s = `${num}`;
  while (s.length < size) s = `0${s}`;
  return s;
}

export default class InviteDialog extends Component {
  static propTypes = {
    entryCode: PropTypes.number,
    hubId: PropTypes.string,
    allowShare: PropTypes.bool,
    onClose: PropTypes.func
  };

  state = {
    copyButtonActive: false,
    shareButtonActive: false
  };

  shareClicked = url => {
    this.setState({ shareButtonActive: true });
    share({ url, title: "Join me now in #hubs!" }).then(() => {
      this.setState({ shareButtonActive: false });
    });
  };

  copyClicked = link => {
    this.setState({ copyButtonActive: true });
    setTimeout(() => this.setState({ copyButtonActive: false }), 5000);

    copy(link);
  };

  render() {
    const { entryCode } = this.props;

    const entryCodeString = pad(entryCode, 6);
    const shortLinkText = `hub.link/${this.props.hubId}`;
    const shortLink = "https://" + shortLinkText;

    return (
      <div className={styles.dialog}>
        <div className={styles.attachPoint} />
        <WithHoverSound>
          <div className={styles.close} onClick={() => this.props.onClose()}>
            <span>×</span>
          </div>
        </WithHoverSound>
        <div>
          <FormattedMessage id="invite.enter_via" />
          <WithHoverSound>
            <a href="https://hub.link" target="_blank" className={styles.hubLinkLink} rel="noopener noreferrer">
              hub.link
            </a>
          </WithHoverSound>
          <FormattedMessage id="invite.and_enter_code" />
        </div>
        <div className={styles.code}>
          {entryCodeString.split("").map((d, i) => (
            <div className={classNames({ [styles.digit]: true, [styles[`digit_${i}`]]: true })} key={`link_code_${i}`}>
              {d}
            </div>
          ))}
        </div>
        <div>
          <FormattedMessage id="invite.or_visit" />
        </div>
        <div className={styles.domain}>
          <input type="text" readOnly onFocus={e => e.target.select()} value={shortLinkText} />
        </div>
        <div className={styles.buttons}>
          <WithHoverSound>
            <button className={styles.linkButton} onClick={this.copyClicked.bind(this, shortLink)}>
              <span>{this.state.copyButtonActive ? "copied!" : "copy"}</span>
            </button>
          </WithHoverSound>
          {this.props.allowShare &&
            navigator.share && (
              <WithHoverSound>
                <button className={styles.linkButton} onClick={this.shareClicked.bind(this, shortLink)}>
                  <span>{this.state.shareButtonActive ? "sharing..." : "share"}</span>
                </button>
              </WithHoverSound>
            )}
          {this.props.allowShare &&
            !navigator.share && (
              <WithHoverSound>
                <button className={styles.linkButton} onClick={this.shareClicked.bind(this, shortLink)}>
                  <FormattedMessage id="invite.tweet" />
                </button>
              </WithHoverSound>
            )}
        </div>
      </div>
    );
  }
}
