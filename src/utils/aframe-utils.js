export function getMeshes(collisionEntities) {
  return collisionEntities
    .map(function(entity) {
      return entity.getObject3D("mesh");
    })
    .filter(function(n) {
      return n;
    });
}

export async function getOwnerId(el) {
  const networkedEl = await NAF.utils.getNetworkedEntity(el).catch(e => {
    console.error("Could not find networked element", e);
  });
  if (!networkedEl) {
    return null;
  }
  return networkedEl.components.networked.data.owner;
}
