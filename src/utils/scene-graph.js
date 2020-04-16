export function findAncestorWithComponent(entity, componentName) {
  while (entity && !(entity.components && entity.components[componentName])) {
    entity = entity.parentNode;
  }
  return entity;
}

export function findComponentsInNearestAncestor(entity, componentName) {
  const components = [];
  while (entity) {
    if (entity.components) {
      for (const c in entity.components) {
        if (entity.components[c].name === componentName) {
          components.push(entity.components[c]);
        }
      }
    }
    if (components.length) {
      return components;
    }
    entity = entity.parentNode;
  }
  return components;
}
