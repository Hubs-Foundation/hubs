import { PrefabName, prefabs } from "../prefabs/prefabs";
import type { ClientID } from "./networking-types";

export function hasPermissionToSpawn(creator: ClientID, prefabName: PrefabName) {
  if (creator === "reticulum") return true;
  const perm = prefabs.get(prefabName)!.permission;
  return APP.hubChannel!.userCan(creator, perm);
}
