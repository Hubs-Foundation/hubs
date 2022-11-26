import { NetworkedTransform } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { ArrayVec3 } from "./jsx-entity";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const runtimeSerde = defineNetworkSchema(NetworkedTransform);

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { position, rotation, scale }: { position: ArrayVec3; rotation: number[]; scale: ArrayVec3 } = data;
  write(NetworkedTransform.position, eid, position);
  write(NetworkedTransform.rotation, eid, rotation);
  write(NetworkedTransform.scale, eid, scale);
  return true;
}

export const NetworkedTransformSchema: NetworkSchema = {
  componentName: "networked-transform",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        position: read(NetworkedTransform.position, eid),
        rotation: read(NetworkedTransform.rotation, eid),
        scale: read(NetworkedTransform.scale, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
