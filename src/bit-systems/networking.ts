import { defineQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, Owned } from "../bit-components";
import { renderAsEntity } from "../utils/jsx-entity";
import { takeOwnership } from "../utils/take-ownership";
import { PrefabName, prefabs } from "../prefabs/prefabs";

export type EntityID = number;
type InitialData = any;
interface CreateMessageData {
  prefabName: PrefabName;
  initialData: InitialData;
}
type ClientID = string;
type NetworkID = string;
export type StringID = number;
type CreateMessage = [networkId: NetworkID, prefabName: PrefabName, initialData: InitialData];
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
type DeleteMessage = NetworkID;
export interface Message {
  fromClientId?: ClientID;
  creates: CreateMessage[];
  updates: UpdateMessage[];
  deletes: DeleteMessage[];
}

export let localClientID: ClientID | null = null;
export function setLocalClientID(clientID: ClientID) {
  localClientID = clientID;
}

export const createMessageDatas: Map<EntityID, CreateMessageData> = new Map();

export function createNetworkedEntityFromRemote(
  world: HubsWorld,
  prefabName: PrefabName,
  initialData: InitialData,
  rootNid: string,
  creator: ClientID,
  owner: ClientID
) {
  const eid = renderAsEntity(world, prefabs.get(prefabName)!.template(initialData));
  const obj = world.eid2obj.get(eid)!;

  createMessageDatas.set(eid, { prefabName, initialData });

  let i = 0;
  obj.traverse(function (o) {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      const eid = o.eid;
      Networked.id[eid] = APP.getSid(i === 0 ? rootNid : `${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = APP.getSid(creator);
      Networked.owner[eid] = APP.getSid(owner);
      if (NAF.clientId === owner) takeOwnership(world, eid);
      i += 1;
    }
  });

  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}

export function spawnAllowed(creator: ClientID, prefabName: PrefabName) {
  const perm = prefabs.get(prefabName)!.permission;
  return !perm || APP.hubChannel!.userCan(creator, perm);
}

export function createNetworkedEntity(world: HubsWorld, prefabName: PrefabName, initialData: InitialData) {
  if (!spawnAllowed(NAF.clientId, prefabName)) throw new Error(`You do not have permission to spawn ${prefabName}`);
  const rootNid = NAF.utils.createNetworkId();
  return createNetworkedEntityFromRemote(world, prefabName, initialData, rootNid, NAF.clientId, NAF.clientId);
}

export const networkedEntitiesQuery = defineQuery([Networked]);
export const ownedNetworkedEntitiesQuery = defineQuery([Networked, Owned]);

export const pendingMessages: Message[] = [];
export const pendingJoins: StringID[] = [];
export const pendingParts: StringID[] = [];
export const partedClientIds = new Set<StringID>();

type Emitter = {
  on: (event: string, callback: (a: any) => any) => number;
  off: (event: string, ref: number) => void;
  trigger: (event: string, payload: any) => void;
  getBindings: () => any[];
};

type PhoenixChannel = any;
export function listenForNetworkMessages(channel: PhoenixChannel, presenceEventEmitter: Emitter) {
  presenceEventEmitter.on("hub:join", ({ key: nid }) => {
    // TODO: Is it OK to use join events for our own client id?
    pendingJoins.push(APP.getSid(nid));
  });
  presenceEventEmitter.on("hub:leave", ({ key: nid }) => {
    pendingParts.push(APP.getSid(nid));
  });
  channel.on("naf", onNaf);
  channel.on("nafr", onNafr);
}
type NafMessage = {
  from_session_id: string;
  data: any;
  dataType: string;
  source: string;
};
function onNaf({ from_session_id, data, dataType }: NafMessage) {
  if (dataType == "nn") {
    (data as Message).fromClientId = from_session_id;
    pendingMessages.push(data);
  }
}
type NafrMessage = {
  from_session_id: string;
  naf: string;
  parsed?: NafMessage;
};
function onNafr(message: NafrMessage) {
  const { from_session_id, naf: unparsedData } = message;
  // Attach the parsed JSON to the message so that
  // PhoenixAdapter can process it without parsing it again.
  message.parsed = JSON.parse(unparsedData);
  message.parsed!.from_session_id = from_session_id;
  onNaf(message.parsed!);
}

export function isNetworkInstantiated(eid: EntityID) {
  return createMessageDatas.has(eid);
}

export function isNetworkInstantiatedByMe(eid: EntityID) {
  return isNetworkInstantiated(eid) && Networked.creator[eid] === APP.getSid(NAF.clientId);
}
