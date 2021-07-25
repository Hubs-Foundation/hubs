import { OwnedEntities } from "./owned-entities";
import { NetworkedEntities } from "./networked-entities-system";
export const meshes = new Map();
export const ownership = new Map();
export const networkedEntities = new NetworkedEntities("foo");
export const ownedEntities = new OwnedEntities();
