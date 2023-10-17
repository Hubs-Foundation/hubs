import { NetworkedMaterial } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const {
    color,
    mapNid
  }: {
    color: string;
    mapNid: number;
  } = data;
  write(NetworkedMaterial.color, eid, APP.getSid(color));
  write(NetworkedMaterial.mapNid, eid, mapNid);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedMaterial);
export const NetworkedMaterialSchema: NetworkSchema = {
  componentName: "networked-material",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        color: APP.getString(read(NetworkedMaterial.color, eid)),
        mapNid: read(NetworkedMaterial.mapNid, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
