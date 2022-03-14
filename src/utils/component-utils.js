// Provides a global registry of running components
export function registerComponentInstance(component, name) {
  window.APP.componentRegistry = window.APP.componentRegistry || {};
  window.APP.componentRegistry[name] = window.APP.componentRegistry[name] || [];
  window.APP.componentRegistry[name].push(component);
}

export function deregisterComponentInstance(component, name) {
  if (!window.APP.componentRegistry || !window.APP.componentRegistry[name]) return;
  window.APP.componentRegistry[name].splice(window.APP.componentRegistry[name].indexOf(component), 1);
}

export function getCurrentStreamer() {
  if (!window.APP || !window.APP.componentRegistry || !window.APP.hubChannel || !window.APP.hubChannel.presence)
    return null;
  const playerInfos = window.APP.componentRegistry["player-info"] || [];
  const presences = window.APP.hubChannel.presence.state;

  for (let i = 0; i < playerInfos.length; i++) {
    const playerInfo = playerInfos[i];
    const presence = presences[playerInfo.playerSessionId];

    if (presence && presence.metas[0] && presence.metas[0].streaming) {
      return playerInfo;
    }
  }

  return null;
}

export function getPlayerInfo(sessionId) {
  const playerInfos = window.APP.componentRegistry["player-info"] || [];
  return playerInfos.find(info => {
    return info.playerSessionId === sessionId;
  });
}
