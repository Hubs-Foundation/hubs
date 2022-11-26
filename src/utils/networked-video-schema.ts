import { NetworkedVideo } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const runtimeSerde = defineNetworkSchema(NetworkedVideo);

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { time, flags }: { time: number; flags: number } = data;
  write(NetworkedVideo.time, eid, time);
  write(NetworkedVideo.flags, eid, flags);
  return true;
}

export const NetworkedVideoSchema: NetworkSchema = {
  componentName: "networked-video",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        time: read(NetworkedVideo.time, eid),
        flags: read(NetworkedVideo.flags, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
