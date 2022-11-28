export function getMeshes(collisionEntities) {
  return collisionEntities
    .map(function (entity) {
      return entity.getObject3D("mesh");
    })
    .filter(function (n) {
      return n;
    });
}
