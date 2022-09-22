import { updateAudioSettings } from "../update-audio-settings";
import configs from "./configs";
export function getCurrentHubId() {
  const qs = new URLSearchParams(location.search);
  const defaultRoomId = configs.feature("default_room_id");

  return (
    qs.get("hub_id") ||
    (document.location.pathname === "/" && defaultRoomId
      ? defaultRoomId
      : document.location.pathname.substring(1).split("/")[0])
  );
}

export function updateVRHudPresenceCount({ presence }) {
  const occupantCount = Object.getOwnPropertyNames(presence.state).length;
  const vrHudPresenceCount = document.querySelector("#hud-presence-count");
  vrHudPresenceCount.setAttribute("text", "value", occupantCount.toString());
}
export function updateSceneCopresentState(presence, scene) {
  const occupantCount = Object.getOwnPropertyNames(presence.state).length;
  if (occupantCount > 1) {
    scene.addState("copresent");
  } else {
    scene.removeState("copresent");
  }
}

export function createHubChannelParams({
  permsToken,
  profile,
  pushSubscriptionEndpoint,
  isMobile,
  isMobileVR,
  isEmbed,
  hubInviteId,
  authToken
}) {
  return {
    profile,
    push_subscription_endpoint: pushSubscriptionEndpoint,
    auth_token: authToken || null,
    perms_token: permsToken || null,
    context: {
      mobile: isMobile || isMobileVR,
      embed: isEmbed,
      hmd: isMobileVR
    },
    hub_invite_id: hubInviteId
  };
}

export function getRoomOwnersPlayerInfo() {
  const result = [];

  const playerInfos = APP.componentRegistry && APP.componentRegistry["player-info"] || [];
  const presences = APP.hubChannel.presence.state;

  for (let i = 0; i < playerInfos.length; i++) {
    const playerInfo = playerInfos[i];
    const presence = presences[playerInfo.playerSessionId];

    if (presence && presence.metas[0] && presence.metas[0].roles.owner) {
      result.push(playerInfo);
    }
  }

  return result;
}

export function isRoomOwner(clientId) {
  const presences = APP.hubChannel.presence.state;
  return presences && presences[clientId] && presences[clientId].metas[0].roles.owner;
}

export const updateRoomPermissions = () => {
  const owners = getRoomOwnersPlayerInfo();
  APP.roomOwnerSources.clear();
  APP.componentRegistry["player-info"]
    .forEach(playerInfo => {
      const sourceEl = playerInfo.el.querySelector("[avatar-audio-source]");
      if (sourceEl) {
        owners.includes(playerInfo) && APP.roomOwnerSources.add(sourceEl);
        const audio = APP.audios.get(sourceEl);
        updateAudioSettings(sourceEl, audio);
      }
    });
};
