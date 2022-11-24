import { PrefabName, prefabs } from "../prefabs/prefabs";
import { ClientID } from "../bit-systems/networking";

export function hasPermissionToSpawn(creator: ClientID, prefabName: PrefabName) {
  const perm = prefabs.get(prefabName)!.permission;
  return !perm || APP.hubChannel!.userCan(creator, perm);
}
