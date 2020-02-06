import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { FormattedMessage } from "react-intl";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";

import styles from "../assets/stylesheets/room-settings-dialog.scss";
import DialogContainer from "./dialog-container";

export default class RoomSettingsDialog extends Component {
  static propTypes = {
    initialSettings: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    showRoomAccessSettings: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = props.initialSettings;
  }

  onSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onChange(this.state);
    this.props.onClose();
  };

  onRoomAccessSettingsChange = e =>
    this.setState({
      allow_promotion: e.target.value === "public"
    });

  renderCheckbox(member_permission, disabled, onChange) {
    return (
      <label className={cx(styles.permission, { [styles.permissionDisabled]: disabled })} key={member_permission}>
        <input
          type="checkbox"
          checked={this.state.member_permissions[member_permission]}
          disabled={disabled}
          onChange={
            onChange ||
            (e =>
              this.setState({
                member_permissions: { ...this.state.member_permissions, [member_permission]: e.target.checked }
              }))
          }
        />
        <FormattedMessage id={`room-settings.${member_permission}`} />
      </label>
    );
  }

  render() {
    const { showRoomAccessSettings } = this.props;
    return (
      <DialogContainer title="Room Settings" {...this.props}>
        <form onSubmit={this.onSubmit} className={styles.roomSettingsForm}>
          <span className={styles.subtitle}>
            <FormattedMessage id="room-settings.name-subtitle" />
          </span>
          <input
            name="name"
            type="text"
            required
            autoComplete="off"
            placeholder="Room name"
            value={this.state.name}
            onFocus={e => handleTextFieldFocus(e.target)}
            onBlur={() => handleTextFieldBlur()}
            onChange={e => this.setState({ name: e.target.value })}
            className={styles.nameField}
          />
          {showRoomAccessSettings && (
            <>
              <span className={styles.subtitle}>
                <FormattedMessage id="room-settings.room-access-subtitle" />
              </span>
              <div className={styles.selectContainer}>
                <label>
                  <input
                    type="radio"
                    value="private"
                    checked={!this.state.allow_promotion}
                    onChange={this.onRoomAccessSettingsChange}
                  />
                  <div>
                    Private
                    <span>Only those with the link can join</span>
                  </div>
                </label>
                <label>
                  <input
                    type="radio"
                    value="public"
                    checked={this.state.allow_promotion}
                    onChange={this.onRoomAccessSettingsChange}
                  />
                  <div>
                    Public
                    <span>Listed on the homepage</span>
                  </div>
                </label>
              </div>
            </>
          )}
          <span className={styles.subtitle}>
            <FormattedMessage id="room-settings.permissions-subtitle" />
          </span>
          <div className={styles.permissions}>
            {this.renderCheckbox("spawn_and_move_media", false, e => {
              const newMemberPermissions = {
                spawn_and_move_media: e.target.checked
              };
              if (!e.target.checked) {
                newMemberPermissions.spawn_camera = false;
                newMemberPermissions.pin_objects = false;
              }
              this.setState({ member_permissions: { ...this.state.member_permissions, ...newMemberPermissions } });
            })}
            <div className={styles.permissionsGroup}>
              {this.renderCheckbox("spawn_camera", !this.state.member_permissions.spawn_and_move_media)}
              {this.renderCheckbox("pin_objects", !this.state.member_permissions.spawn_and_move_media)}
            </div>
            {this.renderCheckbox("spawn_drawing")}
          </div>
          <button type="submit" className={styles.nextButton}>
            <FormattedMessage id="room-settings.apply" />
          </button>
        </form>
      </DialogContainer>
    );
  }
}
