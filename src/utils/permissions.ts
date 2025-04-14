import { prefabs } from "../prefabs/prefabs";
import { PrefabNameT } from "../types";
import type { ClientID } from "./networking-types";

export function hasPermissionToSpawn(creator: ClientID, prefabName: PrefabNameT) {
  if (creator === "reticulum") return true;
  const perm = prefabs.get(prefabName)!.permission;
  return APP.hubChannel!.userCan(creator, perm);
}
