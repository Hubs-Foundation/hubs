export function showHoverEffect(el) {
  const isFrozen = el.sceneEl.is("frozen");
  const isPinned = el.components.pinnable && el.components.pinnable.data.pinned;
  const isSpawner = !!el.components["super-spawner"];
  const canMove =
    window.APP.hubChannel.can("spawn_and_move_media") && (!isPinned || window.APP.hubChannel.can("pin_objects"));
  return (isSpawner || !isPinned || isFrozen) && canMove;
}

export function canMove(entity) {
  const isPinned = entity.components.pinnable && entity.components.pinnable.data.pinned;
  const networkedTemplate = entity && entity.components.networked && entity.components.networked.data.template;
  const isCamera = networkedTemplate === "#interactable-camera";
  const isPen = networkedTemplate === "#interactable-pen";
  return (
    window.APP.hubChannel.can("spawn_and_move_media") &&
    (!isPinned || window.APP.hubChannel.can("pin_objects")) &&
    (!isCamera || window.APP.hubChannel.can("spawn_camera")) &&
    (!isPen || window.APP.hubChannel.can("spawn_drawing"))
  );
}

function sanitizeMessageData(data) {
}

function authorizeOrSanitizeMessageData(data, senderPermissions) {
  const template = data.networkId;
  if (template.endsWith("-avatar")) {
    return;
  } else if (template.endsWith("-media")) {
    return;
  }
  sanitizeMessageData(data);
}

export function authorizeOrSanitizeMessage(message) {
  const { dataType, from_session_id } = message;

  if (dataType === "u" && message.data.isFirstSync && !message.data.persistent) {
    // The server has already authorized first sync messages that result in an instantiation.
    return message;
  }

  // TODO BP - Maybe find a way to avoid doing all this member access.
  const senderPermissions = from_session_id
    ? window.APP.hubChannel.presence.state[from_session_id].metas[0].permissions
    : null;

  if (dataType === "um") {
    for (const data of message.data.d) {
      authorizeOrSanitizeMessageData(data, senderPermissions);
    }
  } else {
    authorizeOrSanitizeMessageData(message.data, senderPermissions);
  }

  return message;
}
