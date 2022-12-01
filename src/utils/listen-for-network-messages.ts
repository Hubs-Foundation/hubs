import { localClientID, pendingJoins, pendingMessages, pendingParts } from "../bit-systems/networking";
import { isStorableMessage } from "./load-room-objects";
import type { ClientID, Message, NetworkID } from "./networking-types";
import { StorableMessage } from "./store-networked-state";

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
  channel.on("pin", onPin);
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

type PinMessage = {
  gltf_node: StorableMessage;
  object_id: NetworkID;
  pinned_by: ClientID;
};
function onPin(pinMessage: PinMessage) {
  if (isStorableMessage(pinMessage.gltf_node)) {
    pinMessage.gltf_node.fromClientId = "reticulum";
    pendingMessages.push(pinMessage.gltf_node);
  }
}
