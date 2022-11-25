import { pendingJoins, pendingMessages, pendingParts } from "../bit-systems/networking";
import type { Message } from "./networking-types";

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
