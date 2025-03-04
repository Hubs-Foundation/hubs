import { NetworkedMediaFrame } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { ArrayVec3 } from "./jsx-entity";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const runtimeSerde = defineNetworkSchema(NetworkedMediaFrame);

const migrations = new Map<number, Migration>();
migrations.set(0, ({ data }: StoredComponent) => {
  return { version: 2, data };
});

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version === 1) {
    const { capturedNid, scale }: { capturedNid: string; scale: ArrayVec3 } = data;
    write(NetworkedMediaFrame.capturedNid, eid, capturedNid);
    write(NetworkedMediaFrame.scale, eid, scale);
    write(NetworkedMediaFrame.flags, eid, 0);
    return true;
  } else if (version === 2) {
    const {
      capturedNid,
      scale,
      flags,
      mediaType
    }: { capturedNid: string; scale: ArrayVec3; flags: number; mediaType: number } = data;
    write(NetworkedMediaFrame.capturedNid, eid, capturedNid);
    write(NetworkedMediaFrame.scale, eid, scale);
    write(NetworkedMediaFrame.flags, eid, flags);
    write(NetworkedMediaFrame.mediaType, eid, mediaType);
    return true;
  }
  return false;
}

export const NetworkedMediaFrameSchema: NetworkSchema = {
  componentName: "networked-media-frame",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 2,
      data: {
        capturedNid: read(NetworkedMediaFrame.capturedNid, eid),
        scale: read(NetworkedMediaFrame.scale, eid),
        flags: read(NetworkedMediaFrame.flags, eid),
        mediaType: read(NetworkedMediaFrame.mediaType, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
