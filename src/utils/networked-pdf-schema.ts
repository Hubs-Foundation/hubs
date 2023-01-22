import { NetworkedPDF } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const runtimeSerde = defineNetworkSchema(NetworkedPDF);
export const NetworkedPDFSchema: NetworkSchema = {
  componentName: "networked-pdf",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        page: read(NetworkedPDF.page, eid)
      }
    };
  },
  deserializeFromStorage: function (eid: EntityID, component: StoredComponent) {
    if (component.version !== 1) {
      // Don't throw, even though it's an error. It's probably not game breaking.
      // TODO It would be nice to have a "strict mode" for development / testing
      // that would elevate the severity of this to throw an error.
      console.error("Failed to deserialize stored networked-pdf component data.", component);
      return;
    }

    const { page }: { page: number } = component.data;
    write(NetworkedPDF.page, eid, page);
  }
};
