import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/close-room-dialog.scss";
import DialogContainer from "./dialog-container";

class CloseRoomDialog extends Component {
  static propTypes = {
    intl: PropTypes.object,
    onConfirm: PropTypes.func,
    onClose: PropTypes.func
  };

  render() {
    const { formatMessage } = this.props.intl;

    return (
      <DialogContainer title={formatMessage({ id: "close-room.title" })} {...this.props}>
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

export default injectIntl(CloseRoomDialog);
