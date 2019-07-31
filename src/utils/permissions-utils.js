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

let authorizedSchemas = null;
function initializeAuthorizedSchemas() {
  /*
  Takes the NAF schemas defined in network-schemas.js and produces a data structure like:
  {
    "#interactable-media": { indices: ["4", "5", "6"] }
  }
  */
  authorizedSchemas = Object.fromEntries(
    Object.entries(NAF.schemas.schemaDict).map(([template, schema]) => {
      const authorizedSchema = {};

      authorizedSchema.indices = (schema.authorizedComponents || [])
        .map(authorizedComponent => {
          const fullComponent = typeof authorizedComponent === "string";
          const componentName = fullComponent ? authorizedComponent : authorizedComponent.component;

          if (fullComponent) {
            return schema.components.findIndex(schemaComponent => schemaComponent === componentName);
          } else {
            return schema.components.findIndex(
              schemaComponent =>
                schemaComponent.component === componentName && schemaComponent.property === authorizedComponent.property
            );
          }
        })
        .map(index => index.toString());

      return [template, authorizedSchema];
    })
  );
}

function sanitizeMessageData(template, data) {
  if (authorizedSchemas === null) {
    initializeAuthorizedSchemas();
  }
  const authorizedSchema = authorizedSchemas[template];
  for (const index in data.components) {
    if (!data.components.hasOwnProperty(index)) continue;
    if (!authorizedSchema.indices.includes(index)) {
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
    // Pass through for other data types. Namely, "drawing-<networkId>" messages
    return message;
  }
}
