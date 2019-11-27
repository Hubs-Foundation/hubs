import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";

import configs from "../utils/configs";
import LinkDialogHeader from "../assets/images/link_dialog_header.svg";
import { WithHoverSound } from "./wrap-with-audio";

import styles from "../assets/stylesheets/link-dialog.scss";

export default class LinkDialog extends Component {
  static propTypes = {
    linkCode: PropTypes.string,
    onClose: PropTypes.func
  };

  render() {
    const { linkCode } = this.props;

    return (
      <div className={styles.dialog}>
        <WithHoverSound>
          <div className={styles.close} onClick={() => this.props.onClose()}>
            <span>×</span>
          </div>
        </WithHoverSound>
        <div>
          {!linkCode && (
            <div>
              <div className={classNames("loading-panel", styles.codeLoadingPanel)}>
                <div className="loader-wrap">
                  <div className="loader">
                    <div className="loader-center" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {linkCode && (
            <div className={styles.contents}>
              <img className={styles.imageHeader} src={LinkDialogHeader} />
              <div className={styles.header}>
                <FormattedMessage id="link.connect_headset" />
              </div>
              <div>
                <FormattedMessage id="link.in_your_browser" />
              </div>
              <a
                href={`https://${configs.SHORTLINK_DOMAIN}`}
                className={styles.domain}
                target="_blank"
                rel="noopener noreferrer"
              >
                {configs.SHORTLINK_DOMAIN}
              </a>
              <div>
                <FormattedMessage id="link.enter_code" />
              </div>
              {linkCode && (
                <div className={styles.code}>
                  {linkCode.split("").map((d, i) => (
                    <span className={styles.digit} key={`link_code_${i}`}>
                      {d}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.keepOpen}>
                <FormattedMessage id="link.do_not_close" />
              </div>
              <WithHoverSound>
                <button className={styles.closeButton} onClick={() => this.props.onClose()}>
                  <FormattedMessage id="link.cancel" />
                </button>
              </WithHoverSound>
            </div>
          )}
        </div>
      </div>
    );
  }
}
