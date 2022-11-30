import { PrefabName } from "../prefabs/prefabs";

export type EntityID = number;
export type InitialData = any;
export interface CreateMessageData {
  prefabName: PrefabName;
  initialData: InitialData;
}
export type ClientID = string;
export type NetworkID = string;
export type StringID = number;
export type CreateMessage = [networkId: NetworkID, prefabName: PrefabName, initialData: InitialData];
export type CursorBuffer = { cursor?: number; push: (data: any) => {} };
export type UpdateMessage = {
  nid: NetworkID;
  lastOwnerTime: number;
  timestamp: number;
  owner: ClientID;
  creator: ClientID;
  componentIds: number[];
  data: CursorBuffer;
};
export type DeleteMessage = NetworkID;
export type Message = {
  fromClientId?: ClientID;
  creates: CreateMessage[];
  updates: UpdateMessage[];
  deletes: DeleteMessage[];
};
