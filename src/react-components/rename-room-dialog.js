import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";

import styles from "../assets/stylesheets/rename-room-dialog.scss";
import DialogContainer from "./dialog-container";

export default class RenameRoomDialog extends Component {
  static propTypes = {
    initialSettings: PropTypes.object,
    onRename: PropTypes.func,
    onClose: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = props.initialSettings;
  }

  onSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onRename(this.state);
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
            placeholder="Room name"
            value={this.state.name}
            onFocus={e => handleTextFieldFocus(e.target)}
            onBlur={() => handleTextFieldBlur()}
            onChange={e => this.setState({ name: e.target.value })}
            className={styles.nameField}
          />
          {Object.keys(this.state.perms).map(perm => (
            <label key={perm}>
              <input
                type="checkbox"
                checked={this.state.perms[perm]}
                onChange={e => this.setState({ perms: { ...this.state.perms, [perm]: e.target.checked } })}
              />
              <FormattedMessage id={`room-settings.${perm}`} />
            </label>
          ))}
          <button type="submit" className={styles.nextButton}>
            <FormattedMessage id="rename-room.rename" />
          </button>
        </form>
      </DialogContainer>
    );
  }
}
