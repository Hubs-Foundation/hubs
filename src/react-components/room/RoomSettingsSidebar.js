import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import styles from "./RoomSettingsSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { InputField } from "../input/InputField";
import { FormattedMessage, useIntl } from "react-intl";
import { ApplyButton } from "../input/Button";
import { TextInputField } from "../input/TextInputField";
import { TextAreaInputField } from "../input/TextAreaInputField";
import { ToggleInput } from "../input/ToggleInput";
import { RadioInputField, RadioInputOption } from "../input/RadioInputField";
import { NumericInputField } from "../input/NumericInputField";
import { BackButton } from "../input/BackButton";
import { SceneInfo } from "./RoomSidebar";
import { Column } from "../layout/Column";
import { InviteLinkInputField } from "./InviteLinkInputField";

export function RoomSettingsSidebar({
  showBackButton,
  accountId,
  room,
  fetchingInvite,
  inviteUrl,
  onRevokeInvite,
  maxRoomSize,
  showPublicRoomSetting,
  onSubmit,
  onClose,
  canChangeScene,
  onChangeScene
}) {
  const intl = useIntl();
  const { handleSubmit, register, watch, errors, setValue } = useForm({
    defaultValues: room
  });

  const entryMode = watch("entry_mode");
  const spawnAndMoveMedia = watch("member_permissions.spawn_and_move_media");

  useEffect(
    () => {
      if (!spawnAndMoveMedia) {
        setValue("member_permissions.spawn_camera", false, { shouldDirty: true });
        setValue("member_permissions.pin_objects", false, { shouldDirty: true });
      }
    },
    [spawnAndMoveMedia, setValue]
  );

  return (
    <Sidebar
      title={<FormattedMessage id="room-settings-sidebar.title" defaultMessage="Room Settings" />}
      beforeTitle={showBackButton ? <BackButton onClick={onClose} /> : <CloseButton onClick={onClose} />}
    >
      <Column padding as="form" onSubmit={handleSubmit(onSubmit)}>
        <SceneInfo
          accountId={accountId}
          scene={room.scene}
          canChangeScene={canChangeScene}
          onChangeScene={onChangeScene}
        />
        <TextInputField
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder={intl.formatMessage({
            id: "room-settings-sidebar.name-placeholder",
            defaultMessage: "Room name"
          })}
          minLength={1}
          maxLength={64}
          label={<FormattedMessage id="room-settings-sidebar.name" defaultMessage="Room Name" />}
          ref={register}
          error={errors.name}
          fullWidth
        />
        <TextAreaInputField
          name="description"
          autoComplete="off"
          placeholder={intl.formatMessage({
            id: "room-settings-sidebar.description-placeholder",
            defaultMessage: "Room Description"
          })}
          label={<FormattedMessage id="room-settings-sidebar.description" defaultMessage="Room Description" />}
          minRows={3}
          ref={register}
          error={errors.description}
          fullWidth
        />
        <NumericInputField
          name="room_size"
          required
          min={0}
          max={maxRoomSize}
          placeholder={intl.formatMessage({
            id: "room-settings-sidebar.room-size-placeholder",
            defaultMessage: "Member Limit"
          })}
          label={<FormattedMessage id="room-settings-sidebar.room-size" defaultMessage="Room Size" />}
          ref={register}
          error={errors.room_size}
          fullWidth
        />
        <RadioInputField
          label={<FormattedMessage id="room-settings-sidebar.room-access" defaultMessage="Room Access" />}
          fullWidth
        >
          <RadioInputOption
            name="entry_mode"
            value="allow"
            label={<FormattedMessage id="room-settings-sidebar.access-shared-link" defaultMessage="Shared link" />}
            description={
              <FormattedMessage
                id="room-settings-sidebar.access-shared-link-description"
                defaultMessage="Only those with the link can join"
              />
            }
            ref={register}
            error={errors.entry_mode}
          />
          <RadioInputOption
            name="entry_mode"
            value="invite"
            label={<FormattedMessage id="room-settings-sidebar.access-invite" defaultMessage="Invite only" />}
            description={
              <FormattedMessage
                id="room-settings-sidebar.access-invite-description"
                defaultMessage="Invite people with a link that can be revoked"
              />
            }
            ref={register}
            error={errors.entry_mode}
          />
        </RadioInputField>
        {entryMode === "invite" && (
          <InviteLinkInputField fetchingInvite={fetchingInvite} inviteUrl={inviteUrl} onRevokeInvite={onRevokeInvite} />
        )}
        {showPublicRoomSetting && (
          <ToggleInput
            name="allow_promotion"
            label={<FormattedMessage id="room-settings-sidebar.access-public" defaultMessage="Public" />}
            description={
              <FormattedMessage
                id="room-settings-sidebar.access-public-description"
                defaultMessage="Listed on the homepage"
              />
            }
            ref={register}
          />
        )}
        <InputField
          label={<FormattedMessage id="room-settings-sidebar.permissions" defaultMessage="Room Member Permissions" />}
          fullWidth
        >
          <div className={styles.roomPermissions}>
            <ToggleInput
              name="member_permissions.spawn_and_move_media"
              label={
                <FormattedMessage
                  id="room-settings-sidebar.spawn-and-move-media"
                  defaultMessage="Create and move objects"
                />
              }
              ref={register}
            />
            <div className={styles.permissionsGroup}>
              <ToggleInput
                name="member_permissions.spawn_camera"
                label={<FormattedMessage id="room-settings-sidebar.spawn-camera" defaultMessage="Create cameras" />}
                ref={register}
                disabled={!spawnAndMoveMedia}
              />
              <ToggleInput
                name="member_permissions.pin_objects"
                label={<FormattedMessage id="room-settings-sidebar.pin-objects" defaultMessage="Pin objects" />}
                ref={register}
                disabled={!spawnAndMoveMedia}
              />
            </div>
            <ToggleInput
              name="member_permissions.spawn_drawing"
              label={<FormattedMessage id="room-settings-sidebar.spawn-drawing" defaultMessage="Create drawings" />}
              ref={register}
            />
            <ToggleInput
              name="member_permissions.spawn_emoji"
              label={<FormattedMessage id="room-settings-sidebar.spawn-emoji" defaultMessage="Create emoji" />}
              ref={register}
            />
            <ToggleInput
              name="member_permissions.fly"
              label={<FormattedMessage id="room-settings-sidebar.fly" defaultMessage="Allow flying" />}
              ref={register}
            />
          </div>
        </InputField>
        <ApplyButton type="submit" />
      </Column>
    </Sidebar>
  );
}

RoomSettingsSidebar.propTypes = {
  accountId: PropTypes.string,
  showBackButton: PropTypes.bool,
  room: PropTypes.object.isRequired,
  fetchingInvite: PropTypes.bool,
  inviteUrl: PropTypes.string,
  onRevokeInvite: PropTypes.func,
  roomSize: PropTypes.number,
  maxRoomSize: PropTypes.number,
  showPublicRoomSetting: PropTypes.bool,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  canChangeScene: PropTypes.bool,
  onChangeScene: PropTypes.func
};
