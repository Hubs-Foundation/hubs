import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/promote-client-dialog.scss";
import DialogContainer from "./dialog-container";

export default class PromoteClientDialog extends Component {
  static propTypes = {
    displayName: PropTypes.string,
    onConfirm: PropTypes.func,
    onClose: PropTypes.func
  };

  render() {
    return (
      <DialogContainer title="Promote User" {...this.props}>
        <div className={styles.message}>
          <FormattedMessage id="promote.message" />
        </div>
        <button
          className={styles.confirmButton}
          onClick={() => {
            this.props.onConfirm();
            this.props.onClose();
          }}
        >
          <FormattedMessage id="promote.confirm-prefix" />
          <span>{this.props.displayName}</span>
        </button>
        <button className={styles.cancelButton} onClick={() => this.props.onClose()}>
          <FormattedMessage id="promote.cancel" />
        </button>
      </DialogContainer>
    );
  }
}
