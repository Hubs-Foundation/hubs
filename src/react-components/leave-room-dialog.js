import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/leave-room-dialog.scss";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";

export default class LeaveRoomDialog extends Component {
  static propTypes = {
    messageType: PropTypes.string,
    destinationUrl: PropTypes.string
  };

  render() {
    return (
      <DialogContainer title="Leave Room" {...this.props}>
        <div className={styles.leaveRoom}>
          <div>
            <FormattedMessage id={`leave-room-dialog.${this.props.messageType}.message`} />
          </div>
          <a href={this.props.destinationUrl} rel="noopener noreferrer">
            <FormattedMessage id={`leave-room-dialog.${this.props.messageType}.confirm`} />
          </a>
        </div>
      </DialogContainer>
    );
  }
}
