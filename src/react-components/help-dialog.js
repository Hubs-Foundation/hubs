import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/help-dialog.scss";
import configs from "../utils/configs";
import { resetTips } from "../systems/tips";

export default class HelpDialog extends Component {
  static propTypes = {
    onClose: PropTypes.func
  };
  render() {
    return (
      <DialogContainer title="Help" {...this.props}>
        <div className={styles.helpDialog}>
          <div>To get started, you can take a tour.</div>
          <div>
            Or, you can{" "}
            <a href={configs.link("docs", "https://hubs.mozilla.com/docs")} rel="noreferrer noopener" target="_blank">
              browse the documentation
            </a>.
          </div>
          <button
            className={styles.tourButton}
            onClick={e => {
              e.preventDefault();
              resetTips();
              this.props.onClose();
            }}
          >
            Start Tour
          </button>
          <a
            className={styles.docsLink}
            href={configs.link("docs", "https://hubs.mozilla.com/docs")}
            rel="noreferrer noopener"
            target="_blank"
          >
            Browse Documentation
          </a>
        </div>
      </DialogContainer>
    );
  }
}
