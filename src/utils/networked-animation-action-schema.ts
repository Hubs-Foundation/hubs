import { NetworkedAnimationAction } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { flags, time, timeScale, weight }: { flags: number; time: number; timeScale: number; weight: number } = data;
  write(NetworkedAnimationAction.flags, eid, flags);
  write(NetworkedAnimationAction.time, eid, time);
  write(NetworkedAnimationAction.timeScale, eid, timeScale);
  write(NetworkedAnimationAction.weight, eid, weight);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedAnimationAction);
export const NetworkedAnimationActionSchema: NetworkSchema = {
  componentName: "networked-animation-action",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        flags: read(NetworkedAnimationAction.flags, eid),
        time: read(NetworkedAnimationAction.time, eid),
        timeScale: read(NetworkedAnimationAction.timeScale, eid),
        weight: read(NetworkedAnimationAction.weight, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
