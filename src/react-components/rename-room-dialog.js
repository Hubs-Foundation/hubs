import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/rename-room-dialog.scss";
import DialogContainer from "./dialog-container";

export default class RenameRoomDialog extends Component {
  static propTypes = {
    onRename: PropTypes.func,
    onClose: PropTypes.func
  };

  state = {
    name: ""
  };

  onSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onRename(this.state.name);
    this.props.onClose();
  };

  render() {
    return (
      <DialogContainer title="Set Room Name" {...this.props}>
        <form onSubmit={this.onSubmit} className={styles.renameRoomForm}>
          <span>
            <FormattedMessage id="rename-room.message" />
          </span>
          <input
            name="name"
            type="text"
            required
            autoFocus
            autoComplete="off"
            minLength={5}
            placeholder="Room name"
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
            className={styles.nameField}
          />
          <button type="submit" className={styles.nextButton}>
            <FormattedMessage id="rename-room.rename" />
          </button>
        </form>
      </DialogContainer>
    );
  }
}
