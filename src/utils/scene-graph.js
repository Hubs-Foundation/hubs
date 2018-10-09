export function findAncestorWithComponent(entity, componentName) {
  while (entity && !(entity.components && entity.components[componentName])) {
    entity = entity.parentNode;
  }
  return entity;
}
