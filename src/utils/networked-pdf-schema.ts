import { NetworkedPDF } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { pageNumber }: { pageNumber: number } = data;
  write(NetworkedPDF.pageNumber, eid, pageNumber);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedPDF);
export const NetworkedPDFSchema: NetworkSchema = {
  componentName: "networked-pdf",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        pageNumber: read(NetworkedPDF.pageNumber, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
