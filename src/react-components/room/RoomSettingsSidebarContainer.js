import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { RoomSettingsSidebar } from "./RoomSettingsSidebar";
import configs from "../../utils/configs";
import { useInviteUrl } from "./hooks/useInviteUrl";

const NotifiablePermissions = ["text_chat", "voice_chat"];

export function RoomSettingsSidebarContainer({ showBackButton, room, hubChannel, onChangeScene, onClose }) {
  const maxRoomSize = configs.feature("max_room_size");

  const { fetchingInvite, inviteUrl, revokeInvite } = useInviteUrl(hubChannel);

  const applyChanges = useCallback(
    settings => {
      hubChannel.updateHub(settings);
      onClose();

      NotifiablePermissions.forEach(perm => {
        if (APP.hub.member_permissions[perm] !== settings.member_permissions[perm]) {
          hubChannel.sendMessage(
            {
              permission: perm,
              status: settings.member_permissions[perm]
            },
            "permission"
          );
        }
      });
    },
    [hubChannel, onClose]
  );

  return (
    <RoomSettingsSidebar
      showBackButton={showBackButton}
      room={room}
      fetchingInvite={fetchingInvite}
      inviteUrl={inviteUrl}
      onRevokeInvite={revokeInvite}
      maxRoomSize={maxRoomSize}
      showPublicRoomSetting={hubChannel.can("update_hub_promotion")}
      onSubmit={applyChanges}
      canChangeScene
      onChangeScene={onChangeScene}
      onClose={onClose}
    />
  );
}

RoomSettingsSidebarContainer.propTypes = {
  showBackButton: PropTypes.bool,
  room: PropTypes.object.isRequired,
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onChangeScene: PropTypes.func
};
