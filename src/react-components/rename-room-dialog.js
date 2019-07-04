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

  renderCheckbox(perm, disabled, onChange) {
    return (
      <label key={perm}>
        <input
          type="checkbox"
          checked={this.state.perms[perm]}
          disabled={disabled}
          onChange={onChange || (e => this.setState({ perms: { ...this.state.perms, [perm]: e.target.checked } }))}
        />
        <FormattedMessage id={`room-settings.${perm}`} />
      </label>
    );
  }

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
          <div>
            {this.renderCheckbox("spawn_and_move_media", false, e => {
              const newPerms = {
                spawn_and_move_media: e.target.checked
              };
              if (!e.target.checked) {
                newPerms.spawn_camera = false;
                newPerms.pin_objects = false;
              }
              this.setState({ perms: { ...this.state.perms, ...newPerms } });
            })}
            <div>
              {this.renderCheckbox("spawn_camera", !this.state.perms.spawn_and_move_media)}
              {this.renderCheckbox("pin_objects", !this.state.perms.spawn_and_move_media)}
            </div>
            {this.renderCheckbox("spawn_drawing")}
          </div>
          <button type="submit" className={styles.nextButton}>
            <FormattedMessage id="rename-room.rename" />
          </button>
        </form>
      </DialogContainer>
    );
  }
}
