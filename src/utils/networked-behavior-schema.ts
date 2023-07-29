import { HubsWorld } from "../app";
import { NetworkedBehavior, NetworkedBehaviorData } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
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

function serialize(world: HubsWorld, eid: EntityID, data: CursorBuffer, isFullSync: boolean, writeToShadow: boolean) {
  let result = false;
  if (runtimeSerde.serialize(world, eid, data, isFullSync, writeToShadow)) {
    if (NetworkedBehaviorData.has(eid)) {
      data[data.length - 1] = [data[data.length - 1], JSON.stringify(NetworkedBehaviorData.get(eid), serMap)];
      result = true;
    } else {
      data.pop();
      result = false;
    }
  }
  return result;
}

function deserialize(world: HubsWorld, eid: EntityID, data: CursorBuffer) {
  const updatedPids = data[data.cursor!++] as Array<any>;
  const componentData = data[data.cursor!++];
  NetworkedBehavior.timestamp[eid] = componentData[0];
  const map = JSON.parse(componentData[1], desMap);
  NetworkedBehaviorData.set(eid, map);
}

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;
  const map = JSON.parse(data, desMap);
  NetworkedBehaviorData.set(eid, map);
  return true;
}
const runtimeSerde = defineNetworkSchema(NetworkedBehavior);
export const NetworkedBehaviorSchema: NetworkSchema = {
  componentName: "networked-behavior",
  serialize,
  deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: NetworkedBehaviorData.has(eid) ? JSON.stringify(NetworkedBehaviorData.get(eid), serMap) : {}
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
