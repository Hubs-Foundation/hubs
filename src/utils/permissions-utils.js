export function canMove(entity, isPinned) {
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
