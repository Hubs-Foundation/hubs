import { PrefabName, prefabs } from "../prefabs/prefabs";
import type { ClientID } from "./networking-types";

export function hasPermissionToSpawn(creator: ClientID, prefabName: PrefabName) {
  const perm = prefabs.get(prefabName)!.permission;
  return !perm || APP.hubChannel!.userCan(creator, perm);
}
