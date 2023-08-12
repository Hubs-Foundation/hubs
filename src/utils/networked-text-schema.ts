import { NetworkedText } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { text, fontSize, color, fillOpacity }: { text: string; fontSize: number; color: number; fillOpacity: number } =
    data;
  write(NetworkedText.text, eid, text);
  write(NetworkedText.fontSize, eid, fontSize);
  write(NetworkedText.color, eid, color);
  write(NetworkedText.fillOpacity, eid, fillOpacity);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedText);
export const NetworkedTextSchema: NetworkSchema = {
  componentName: "networked-text",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        text: read(NetworkedText.text, eid),
        fontSize: read(NetworkedText.fontSize, eid),
        color: read(NetworkedText.color, eid),
        fillOpacity: read(NetworkedText.fillOpacity, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
