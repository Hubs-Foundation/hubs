import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { RoomSettingsSidebar } from "./RoomSettingsSidebar";
import configs from "../../utils/configs";
import { hubUrl } from "../../utils/phoenix-utils";

function useInviteUrl(hubChannel) {
  const [inviteId, setInviteId] = useState();

  useEffect(
    () => {
      setInviteId(undefined);

      hubChannel
        .fetchInvite()
        .then(({ hub_invite_id }) => {
          setInviteId(hub_invite_id);
        })
        .catch(error => {
          console.error("Error fetching invite", error);
        });
    },
    [hubChannel]
  );

  const revokeInvite = useCallback(
    () => {
      setInviteId(undefined);

      hubChannel
        .revokeInvite(inviteId)
        .then(({ hub_invite_id }) => {
          setInviteId(hub_invite_id);
        })
        .catch(error => {
          console.error("Error revoking invite", error);
        });
    },
    [inviteId, hubChannel]
  );

  const inviteUrl = useMemo(
    () => {
      if (inviteId) {
        const url = hubUrl();
        url.searchParams.set("hub_invite_id", inviteId);
        return url.toString();
      }

      return undefined;
    },
    [inviteId]
  );

  const fetchingInvite = !inviteId;

  return { fetchingInvite, inviteUrl, revokeInvite };
}

export function RoomSettingsSidebarContainer({ showBackButton, room, hubChannel, onClose }) {
  const maxRoomSize = configs.feature("max_room_size");

  const { fetchingInvite, inviteUrl, revokeInvite } = useInviteUrl(hubChannel);

  const applyChanges = useCallback(
    settings => {
      hubChannel.updateHub(settings);
      onClose();
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
      onClose={onClose}
    />
  );
}

RoomSettingsSidebarContainer.propTypes = {
  showBackButton: PropTypes.bool,
  room: PropTypes.object.isRequired,
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};
