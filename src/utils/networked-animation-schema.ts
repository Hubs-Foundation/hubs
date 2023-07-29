import { HubsWorld } from "../app";
import { NetworkedAnimationActionsData, NetworkedAnimation } from "../bit-components";
import { AnimationActionDataT, AnimationActionsMap } from "../bit-systems/behavior-graph/animation-nodes";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, StoredComponent } from "./network-schemas";
import type { CursorBuffer, EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

const datas = new Array();
function serialize(world: HubsWorld, eid: EntityID, data: CursorBuffer, isFullSync: boolean, writeToShadow: boolean) {
  let result = false;
  if (runtimeSerde.serialize(world, eid, data, isFullSync, writeToShadow)) {
    if (NetworkedAnimationActionsData.has(eid)) {
      const actionDatas = NetworkedAnimationActionsData.get(eid)!;
      datas.length = 0;
      actionDatas.forEach((actionData: AnimationActionDataT, actionId: number) => {
        datas.push([actionId, [actionData.time, actionData.timeScale, actionData.weight, actionData.flags]]);
      });
      if (datas.length > 0) {
        data[data.length - 1] = [data[data.length - 1], datas];
      } else {
        data.pop();
      }
      result = datas.length > 0;
    } else {
      data.pop();
      result = false;
    }
  }
  return result;
}

// If we alter this order, a migration would be required
const ACTION_IDX = 0;
const ACTION_DATA_IDX = 1;
const TIME_IDX = 0;
const TIME_SCALE_IDX = 1;
const WEIGHT_IDX = 2;
const FLAGS_IDX = 3;

function deserialize(world: HubsWorld, eid: EntityID, data: CursorBuffer) {
  const updatedPids = data[data.cursor!++] as Array<any>;
  const componentData = data[data.cursor!++];
  NetworkedAnimation.timestamp[eid] = componentData[0];
  if (NetworkedAnimationActionsData.has(eid)) {
    const rawActionData = componentData[1];
    if (!NetworkedAnimationActionsData.has(eid)) {
      NetworkedAnimationActionsData.set(eid, new AnimationActionsMap());
    }
    const actionDatas = NetworkedAnimationActionsData.get(eid)!;
    for (let i = 0; i < rawActionData.length; i++) {
      const actionId = rawActionData[i][ACTION_IDX];
      const actionData = {
        time: rawActionData[i][ACTION_DATA_IDX][TIME_IDX],
        timeScale: rawActionData[i][ACTION_DATA_IDX][TIME_SCALE_IDX],
        weight: rawActionData[i][ACTION_DATA_IDX][WEIGHT_IDX],
        flags: rawActionData[i][ACTION_DATA_IDX][FLAGS_IDX]
      };
      actionDatas.set(actionId, actionData);
    }
  }
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
  NetworkedAnimationActionsData.set(eid, new Map(data));
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedAnimation);
export const NetworkedAnimationSchema: NetworkSchema = {
  componentName: "networked-animation",
  serialize,
  deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: serializeAnimationDataForStorage(eid)
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
