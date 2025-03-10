import { MediaLoaderParams } from "../inflators/media-loader";
import { PrefabNameT } from "../types";

export type EntityID = number;
export type InitialData = MediaLoaderParams | any;
export interface CreateMessageData {
  prefabName: PrefabNameT;
  initialData: InitialData;
}
export type ClientID = string;
export type NetworkID = string;
export type StringID = number;
export type CreateMessage = {
  version: 1;
  networkId: NetworkID;
  prefabName: PrefabNameT;
  initialData: InitialData;
};
export interface CursorBuffer extends Array<any> {
  cursor?: number;
}
export type UpdateMessage = CursorBufferUpdateMessage | StorableUpdateMessage;
export interface UpdateMessageBase {
  nid: NetworkID;
  lastOwnerTime: number;
  timestamp: number;
  owner: ClientID;
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
export interface StorableMessage extends Message {
  version: 1;
}

export type FileInfo = {
  file_id: string;
  file_access_token: string;
  promotion_token: string;
};

export type SaveEntityStatePayload = {
  root_nid: NetworkID;
  nid: NetworkID;
  message: StorableMessage;
  file?: FileInfo;
};

export type CreatorChange = {
  nid: NetworkID;
  creator: ClientID;
};
