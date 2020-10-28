import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { hubUrl } from "../utils/phoenix-utils";
import styles from "../assets/stylesheets/room-settings-dialog.scss";
import configs from "../utils/configs";
import { Sidebar, CloseButton } from "./sidebar/Sidebar";
import { Button } from "./input/Button";
import { TextInputField } from "./input/TextInputField";
import { TextAreaInputField } from "./input/TextAreaInputField";
import { ToggleInput } from "./input/ToggleInput";
import { RadioInputField } from "./input/RadioInputField";
import { NumericInputField } from "./input/NumericInputField";
import { InputField } from "./input/InputField";
import { CopyableTextInputField } from "./input/CopyableTextInputField";

export default class RoomSettingsDialog extends Component {
  static propTypes = {
    initialSettings: PropTypes.object,
    onChange: PropTypes.func,
    hubChannel: PropTypes.object,
    onClose: PropTypes.func,
    showPublicRoomSetting: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = props.initialSettings;
    this.state.fetchingInvite = false;
    this.state.confirmRevoke = false;
  }

  onSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onChange(this.state);
    this.props.onClose();
  };

  onRoomAccessSettingsChange = async e => {
    const newEntryMode = e.target.value;
    if (newEntryMode === "invite") {
      this.setState({ fetchingInvite: true });
      const result = await this.props.hubChannel.fetchInvite();
      this.setState({ fetchingInvite: false, hubInviteId: result.hub_invite_id });
    }
    this.setState({ entry_mode: newEntryMode });
  };

  onRevokeInvite = async () => {
    this.setState({ fetchingInvite: true });
    const result = await this.props.hubChannel.revokeInvite(this.state.hubInviteId);
    this.setState({ fetchingInvite: false, hubInviteId: result.hub_invite_id, confirmRevoke: false });
  };

  async componentDidMount() {
    if (this.state.entry_mode === "invite") {
      this.setState({ fetchingInvite: true });
      const result = await this.props.hubChannel.fetchInvite();
      this.setState({ fetchingInvite: false, hubInviteId: result.hub_invite_id });
    }
  }

  renderCheckbox(member_permission, disabled, onChange) {
    return (
      <ToggleInput
        value={this.state.member_permissions[member_permission]}
        disabled={disabled}
        onChange={
          onChange ||
          (e =>
            this.setState({
              member_permissions: { ...this.state.member_permissions, [member_permission]: e.target.checked }
            }))
        }
        label={<FormattedMessage id={`room-settings.${member_permission}`} />}
      />
    );
  }

  inviteUrl() {
    const url = hubUrl();
    url.searchParams.set("hub_invite_id", this.state.hubInviteId);
    return url.toString();
  }

  render() {
    const { showPublicRoomSetting, onClose } = this.props;

    const maxRoomSize = configs.feature("max_room_size");

    return (
      <Sidebar title="Room Settings" beforeTitle={<CloseButton onClick={onClose} />}>
        <form onSubmit={this.onSubmit} className={styles.roomSettingsForm}>
          <TextInputField
            name="name"
            type="text"
            required
            autoComplete="off"
            placeholder="Room name"
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
            label={<FormattedMessage id="room-settings.name-subtitle" />}
          />
          <TextAreaInputField
            name="description"
            autoComplete="off"
            placeholder="Room description"
            value={this.state.description || ""}
            onChange={e => this.setState({ description: e.target.value })}
            label={<FormattedMessage id="room-settings.description-subtitle" />}
          />
          <NumericInputField
            name="room_size"
            required
            min={0}
            max={maxRoomSize}
            placeholder="Member Limit"
            value={this.state.room_size}
            onChange={e => this.setState({ room_size: e.target.value })}
            label={<FormattedMessage id="room-settings.room-size-subtitle" />}
          />
          <RadioInputField
            label={<FormattedMessage id="room-settings.room-access-subtitle" />}
            value={this.state.entry_mode}
            options={[
              {
                id: "allow",
                value: "allow",
                label: <FormattedMessage id="room-settings.access-shared-link" />,
                description: <FormattedMessage id="room-settings.access-shared-link-subtitle" />
              },
              {
                id: "invite",
                value: "invite",
                label: <FormattedMessage id="room-settings.access-invite" />,
                description: <FormattedMessage id="room-settings.access-invite-subtitle" />
              }
            ]}
            onChange={this.onRoomAccessSettingsChange}
          />
          {this.state.entry_mode === "invite" && (
            <div className={styles.inviteLinkContainer}>
              <CopyableTextInputField
                label="Invite link"
                disabled={this.state.fetchingInvite}
                value={this.state.fetchingInvite ? "..." : this.inviteUrl()}
                buttonPreset="blue"
                description={
                  !this.state.fetchingInvite &&
                  (this.state.confirmRevoke ? (
                    <>
                      <FormattedMessage id="room-settings.revoke-confirm" />{" "}
                      <a onClick={this.onRevokeInvite}>
                        <FormattedMessage id="room-settings.revoke-confirm-yes" />
                      </a>{" "}
                      /{" "}
                      <a onClick={() => this.setState({ confirmRevoke: false })}>
                        <FormattedMessage id="room-settings.revoke-confirm-no" />
                      </a>
                    </>
                  ) : (
                    <a onClick={() => this.setState({ confirmRevoke: true })}>
                      <FormattedMessage id="room-settings.revoke" />
                    </a>
                  ))
                }
              />
            </div>
          )}
          {showPublicRoomSetting && (
            <ToggleInput
              value={this.state.allow_promotion}
              onChange={e => this.setState({ allow_promotion: e.target.checked })}
              label={<FormattedMessage id="room-settings.access-public" />}
              description={<FormattedMessage id="room-settings.access-public-subtitle" />}
            />
          )}
          <InputField label={<FormattedMessage id="room-settings.permissions-subtitle" />}>
            <div className={styles.roomPermissions}>
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
              {this.renderCheckbox("spawn_emoji")}
              {this.renderCheckbox("fly")}
            </div>
          </InputField>
          <Button type="submit" preset="accept">
            <FormattedMessage id="room-settings.apply" />
          </Button>
        </form>
      </Sidebar>
    );
  }
}
