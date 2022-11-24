import { HubsWorld } from "../app";
import { PrefabName } from "../prefabs/prefabs";
import { hasPermissionToSpawn } from "../utils/permissions";
import { InitialData, createNetworkedEntityFromRemote } from "../bit-systems/networking";

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!hasPermissionToSpawn(NAF.clientId, prefabName))
    throw new Error(`You do not have permission to spawn ${prefabName}`);
  const rootNid = NAF.utils.createNetworkId();
  return createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, NAF.clientId, NAF.clientId);
}
