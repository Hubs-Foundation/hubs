import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/close-room-dialog.scss";
import DialogContainer from "./dialog-container";

export default class CloseRoomDialog extends Component {
  static propTypes = {
    onConfirm: PropTypes.func,
    onClose: PropTypes.func
  };

  render() {
    return (
      <DialogContainer title="Close Room" {...this.props}>
        <div className={styles.message}>
          <FormattedMessage id="close-room.message" />
        </div>
        <button
          className={styles.confirmButton}
          onClick={() => {
            this.props.onConfirm();
            this.props.onClose();
          }}
        >
          <FormattedMessage id="close-room.confirm" />
        </button>
        <button className={styles.cancelButton} onClick={() => this.props.onClose()}>
          <FormattedMessage id="close-room.cancel" />
        </button>
      </DialogContainer>
    );
  }
}
