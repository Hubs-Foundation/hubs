import {
  localClientID,
  pendingCreatorChanges,
  pendingJoins,
  pendingMessages,
  pendingParts
} from "../bit-systems/networking";
import { EntityState } from "./entity-state-utils";
import type { ClientID, CreatorChange, Message } from "./networking-types";

type Emitter = {
  on: (event: string, callback: (a: any) => any) => number;
  off: (event: string, ref: number) => void;
  trigger: (event: string, payload: any) => void;
  getBindings: () => any[];
};
type PhoenixChannel = any;

export function listenForNetworkMessages(channel: PhoenixChannel, presenceEventEmitter: Emitter) {
  presenceEventEmitter.on("hub:join", onJoin);
  presenceEventEmitter.on("hub:leave", onLeave);
  channel.on("naf", onNaf);
  channel.on("nafr", onNafr);
  channel.on("entity_state_created", onEntityStateCreated);
  channel.on("entity_state_updated", onEntityStateUpdated);
  channel.on("entity_state_deleted", onEntityStateDeleted);
}

function onJoin({ key }: { key: ClientID }) {
  if (key !== localClientID!) {
    pendingJoins.push(APP.getSid(key));
  }
}

function onLeave({ key }: { key: ClientID }) {
  if (key !== localClientID!) {
    pendingParts.push(APP.getSid(key));
  }
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

export function queueEntityStateAsMessage(entityState: EntityState) {
  const rootNid = entityState.create_message.networkId;
  entityState.update_messages.forEach(update => {
    if (update.nid === rootNid) {
      update.creator = "reticulum";
    }
    update.owner = "reticulum";
  });
  pendingMessages.push({
    fromClientId: "reticulum",
    creates: [entityState.create_message],
    updates: entityState.update_messages,
    deletes: []
  });
  pendingCreatorChanges.push({
    nid: rootNid,
    creator: "reticulum"
  });
}

function onEntityStateCreated(response: { data: EntityState[] }) {
  console.log("entity_state_created", response);
  queueEntityStateAsMessage(response.data[0]!);
}

function onEntityStateUpdated(response: any) {
  console.log("entity_state_updated", response);
}

function onEntityStateDeleted(response: CreatorChange) {
  console.log("entity_state_deleted", response);
  pendingCreatorChanges.push(response);
}
