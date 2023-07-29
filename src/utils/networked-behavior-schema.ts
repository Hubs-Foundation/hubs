import { HubsWorld } from "../app";
import { NetworkedBehaviorData } from "../bit-components";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { CursorBuffer, EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

type MapValueT = number | string | Map<string, MapValueT>;

function serMap(key: string, value: MapValueT) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries())
    };
  } else {
    return value;
  }
}

function desMap(key: any, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    }
  }
  return value;
}

function serialize(eid: EntityID, data: CursorBuffer) {
  if (NetworkedBehaviorData.has(eid)) {
    data.push(JSON.stringify(NetworkedBehaviorData.get(eid), serMap));
    return true;
  } else {
    return false;
  }
}

function deserialize(eid: EntityID, data: CursorBuffer) {
  const componentData = data[data.cursor!++];
  const map = JSON.parse(componentData, desMap);
  NetworkedBehaviorData.set(eid, map);
  return true;
}

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;
  return deserialize(eid, data);
}

export const NetworkedBehaviorSchema: NetworkSchema = {
  componentName: "networked-behavior",
  serialize: (
    world: HubsWorld,
    eid: EntityID,
    data: CursorBuffer,
    isFullSync: boolean,
    writeToShadow: boolean
  ): boolean => serialize(eid, data),
  deserialize: (world: HubsWorld, eid: EntityID, data: CursorBuffer): boolean => deserialize(eid, data),
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: NetworkedBehaviorData.has(eid) ? JSON.stringify(NetworkedBehaviorData.get(eid), serMap) : {}
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
