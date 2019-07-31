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

function indexForNonAuthorizedComponent(nonAuthorizedComponent, schema) {
  const fullComponent = typeof nonAuthorizedComponent === "string";
  const componentName = fullComponent ? nonAuthorizedComponent : nonAuthorizedComponent.component;

  if (fullComponent) {
    return schema.components.findIndex(schemaComponent => schemaComponent === componentName);
  } else {
    return schema.components.findIndex(
      schemaComponent =>
        schemaComponent.component === componentName && schemaComponent.property === nonAuthorizedComponent.property
    );
  }
}

let nonAuthorizedSchemas = null;
function initializeNonAuthorizedSchemas() {
  /*
  Takes the NAF schemas defined in network-schemas.js and produces a data structure of template name to non-authorized
  component indices:
  {
    "#interactable-media": ["4", "5", "6"]
  }
  */
  nonAuthorizedSchemas = {};
  const { schemaDict } = NAF.schemas;
  for (const template in schemaDict) {
    if (!schemaDict.hasOwnProperty(template)) continue;
    const schema = schemaDict[template];
    nonAuthorizedSchemas[template] = (schema.nonAuthorizedComponents || [])
      .map(nonAuthorizedComponent => indexForNonAuthorizedComponent(nonAuthorizedComponent, schema))
      .map(index => index.toString());
  }
}

function sanitizeMessageData(template, data) {
  if (nonAuthorizedSchemas === null) {
    initializeNonAuthorizedSchemas();
  }
  const nonAuthorizedIndices = nonAuthorizedSchemas[template];
  for (const index in data.components) {
    if (!data.components.hasOwnProperty(index)) continue;
    if (!nonAuthorizedIndices.includes(index)) {
      data.components[index] = null;
    }
  }
  return data;
}

function authorizeEntityManipulation(entity, sender, senderPermissions) {
  const { template, creator } = entity.components.networked.data;
  const isPinned = entity.components.pinnable && entity.components.pinnable.data.pinned;
  const isCreator = sender === creator;

  if (template.endsWith("-avatar")) {
    return isCreator;
  } else if (template.endsWith("-media")) {
    return (!isPinned || senderPermissions.pin_objects) && (isCreator || senderPermissions.spawn_and_move_media);
  } else if (template.endsWith("-camera")) {
    return isCreator || senderPermissions.spawn_camera;
  } else if (template.endsWith("-pen")) {
    return isCreator || senderPermissions.spawn_pen;
  } else {
    return false;
  }
}

function authorizeOrSanitizeMessageData(data, sender, senderPermissions) {
  const entity = NAF.entities.getEntity(data.networkId);
  if (!entity) return false;

  if (authorizeEntityManipulation(entity, sender, senderPermissions)) {
    return true;
  } else {
    const { template } = entity.components.networked.data;
    sanitizeMessageData(template, data);
    return true;
  }
}

const emptyObject = {};
export function authorizeOrSanitizeMessage(message) {
  const { dataType, from_session_id } = message;

  if (dataType === "u" && message.data.isFirstSync && !message.data.persistent) {
    // The server has already authorized first sync messages that result in an instantiation.
    return message;
  }

  const senderPermissions = from_session_id
    ? window.APP.hubChannel.presence.state[from_session_id].metas[0].permissions
    : null;

  if (dataType === "um") {
    for (const index in message.data.d) {
      if (!message.data.d.hasOwnProperty(index)) continue;
      const authorizedOrSanitized = authorizeOrSanitizeMessageData(
        message.data.d[index],
        from_session_id,
        senderPermissions
      );
      if (!authorizedOrSanitized) {
        message.data.d[index] = emptyObject;
      }
    }
    return message;
  } else if (dataType === "u") {
    const authorizedOrSanitized = authorizeOrSanitizeMessageData(message.data, from_session_id, senderPermissions);
    if (authorizedOrSanitized) {
      return message;
    } else {
      return emptyObject;
    }
  } else if (dataType === "r") {
    const entity = NAF.entities.getEntity(message.data.networkId);
    if (!entity) return emptyObject;
    if (authorizeEntityManipulation(entity, from_session_id, senderPermissions)) {
      return message;
    } else {
      return emptyObject;
    }
  } else {
    // Fall through for other data types. Namely, "drawing-<networkId>" messages at the moment.
    return message;
  }
}
