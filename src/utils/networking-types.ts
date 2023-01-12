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
export interface CursorBuffer extends Array<any> {
  cursor?: number;
}
export type UpdateMessage = CursorBufferUpdateMessage | StorableUpdateMessage;
export interface UpdateMessageBase {
  nid: NetworkID;
  lastOwnerTime: number;
  timestamp: number;
  owner: ClientID;
  creator: ClientID;
}
export interface CursorBufferUpdateMessage extends UpdateMessageBase {
  componentIds: number[];
  data: CursorBuffer;
}
export interface StorableUpdateMessage extends UpdateMessageBase {
  data: any; // todo
}
export type DeleteMessage = NetworkID;
export type Message = {
  fromClientId?: ClientID;
  creates: CreateMessage[];
  updates: UpdateMessage[];
  deletes: DeleteMessage[];
};
