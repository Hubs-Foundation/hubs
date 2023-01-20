import { localClientID, pendingJoins, pendingMessages, pendingParts } from "../bit-systems/networking";
import HubChannel from "./hub-channel";
import { listEntityStates, parseStorableMessages } from "./hub-channel-utils";
import type { ClientID, Message, StorableMessage } from "./networking-types";

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
  channel.on("entity_state_saved", onStorableMessage);
  channel.on("entity_state_deleted", onStorableMessage);
  channel.on("entity_state_hierarchy_deleted", onStorableMessage);
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

function onStorableMessage(message: StorableMessage) {
  message.fromClientId = "reticulum";
  pendingMessages.push(message);
}

export async function loadSavedEntityStates(hubChannel: HubChannel) {
  if (!localClientID) {
    throw new Error("Cannot load saved entity states without a local client ID.");
  }
  const list = await listEntityStates(hubChannel);
  const messages = parseStorableMessages(list);
  messages.forEach(onStorableMessage);
}
