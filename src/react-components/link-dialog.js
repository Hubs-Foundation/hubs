import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/link-dialog.scss";

class LinkDialog extends Component {
  static propTypes = {
    linkCode: PropTypes.string
  };

  render() {
    if (!this.props.linkCode) {
      return (
        <div>
          <div className={classNames("loading-panel", styles.codeLoadingPanel)}>
            <div className="loader-wrap">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div>
          <FormattedMessage id="link.in_your_browser" />
        </div>
        <a href="https://hub.link" className={styles.domain} target="_blank" rel="noopener noreferrer">
          hub.link
        </a>
        <div>
          <FormattedMessage id="link.enter_code" />
        </div>
        <div className={styles.code}>
          {this.props.linkCode.split("").map((d, i) => (
            <span className={styles.digit} key={`link_code_${i}`}>
              {d}
            </span>
          ))}
        </div>
        <div className={styles.keepOpen}>
          <FormattedMessage id="link.do_not_close" />
        </div>
      </div>
    );
  }
}

export default LinkDialog;
