import { HubsWorld } from "../app";
import { NetworkedAnimationActionsData, NetworkedAnimation } from "../bit-components";
import {
  AnimationActionDataT,
  AnimationActionsDataMap,
  AnimationActionsMap
} from "../bit-systems/behavior-graph/animation-nodes";
import { deserializerWithMigrations, Migration, NetworkSchema, StoredComponent } from "./network-schemas";
import type { CursorBuffer, EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function serialize(eid: EntityID, data: CursorBuffer) {
  if (NetworkedAnimationActionsData.has(eid)) {
    const actionDatas = NetworkedAnimationActionsData.get(eid)!;
    actionDatas.forEach((actionData: AnimationActionDataT, actionId: number) => {
      data.push([
        NetworkedAnimation.timestamp[eid],
        actionId,
        [actionData.time, actionData.timeScale, actionData.weight, actionData.flags]
      ]);
    });
    return true;
  } else {
    return false;
  }
}

// If we alter this order, a migration would be required
const TIMESTAMP_IDX = 0;
const ACTION_IDX = 1;
const ACTION_DATA_IDX = 2;
const TIME_IDX = 0;
const TIME_SCALE_IDX = 1;
const WEIGHT_IDX = 2;
const FLAGS_IDX = 3;

function deserialize(eid: EntityID, data: CursorBuffer) {
  if (NetworkedAnimationActionsData.has(eid)) {
    const actionDatas = NetworkedAnimationActionsData.get(eid) || new AnimationActionsMap();
    for (let i = 0; i < data.length; i++) {
      NetworkedAnimation.timestamp[eid] = data[i][TIMESTAMP_IDX];
      const actionId = data[i][ACTION_IDX];
      const actionData = actionDatas.get(actionId) || new AnimationActionsDataMap();
      actionData.time = data[i][ACTION_DATA_IDX][TIME_IDX];
      actionData.timeScale = data[i][ACTION_DATA_IDX][TIME_SCALE_IDX];
      actionData.weight = data[i][ACTION_DATA_IDX][WEIGHT_IDX];
      actionData.flags = data[i][ACTION_DATA_IDX][FLAGS_IDX];
    }
  }
  return true;
}

function serializeAnimationDataForStorage(eid: EntityID) {
  if (NetworkedAnimationActionsData.has(eid)) {
    const actionDatas = NetworkedAnimationActionsData.get(eid)!;
    return Object.fromEntries(actionDatas);
  }

  return {};
}

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;
  return deserialize(eid, data);
}

export const NetworkedAnimationSchema: NetworkSchema = {
  componentName: "networked-animation",
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
      data: serializeAnimationDataForStorage(eid)
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
