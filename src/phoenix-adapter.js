import { freeze } from "./freeze";
import { transportForChannel } from "./transport-for-channel";
import { authorizeOrSanitizeMessage } from "./utils/permissions-utils";

export default class PhoenixAdapter {
  constructor() {
    this.occupants = []; // TODO: Remove
  }
  setServerUrl(url) {
    this.serverUrl = url;
  }
  setApp() {}
  setRoom() {}
  setWebRtcOptions() {}

  setServerConnectListeners(successListener, failureListener) {
    this.successListener = successListener;
    this.failureListener = failureListener;
  }
  setRoomOccupantListener() {}
  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.openListener = openListener;
    this.closedListener = closedListener;
    this.messageListener = messageListener;
  }

  async connect() {
    const handleIncomingNAF = data => {
      // TODO: authorizeORSanitizeMessage(data)
      const message = authorizeOrSanitizeMessage(data);
      const source = "phx-reliable";
      if (!message.dataType) return;

      message.source = source;

      //TODO: Handle frozen
      if (this.frozen) {
        this.storeMessage(message);
      } else {
        this.messageListener(null, message.dataType, message.data, message.source);
      }
    };
    this.hubChannel.channel.on("naf", handleIncomingNAF);
    this.hubChannel.channel.on("nafr", ({ from_session_id, naf: unparsedData }) => {
      // Server optimization: server passes through unparsed NAF message, we must now parse it.
      const data = JSON.parse(unparsedData);
      data.from_session_id = from_session_id;
      handleIncomingNAF(data);
    });
    this.successListener(this.session_id);
    const hubId = this.hubChannel.hubId;

    this.reliableTransport = transportForChannel(this.hubChannel.channel, true);
    this.unreliableTransport = transportForChannel(this.hubChannel.channel, false);

    this.hubChannel.presence.list().forEach((key, meta) => {
      console.log("Adding existing occupant", { key }, key, freeze(meta));
      this.occupants.push(key);
      this.openListener(key);
    });
    this.events.on(`hub:${hubId}:join`, ({ key, meta }) => {
      console.log("Occupant joined", key, freeze(meta));
      this.occupants.push(key);
      this.openListener(key);
    });
    this.events.on(`hub:${hubId}:leave`, ({ key, meta }) => {
      console.log("Occupant left", key, freeze(meta));
      this.occupants.slice(this.occupants.indexOf(key), 1);
      this.closedListener(key);
    });
  }
  shouldStartConnectionTo() {}
  startStreamConnection() {}
  closeStreamConnection() {}
  getConnectStatus(clientId) {
    // TODO
  }

  getMediaStream() {
    return Promise.reject("Interface method not implemented: getMediaStream");
  }

  getServerTime() {
    return Date.now();
  }

  sendData(clientId, dataType, data) {
    this.unreliableTransport(clientId, dataType, data);
  }
  sendDataGuaranteed(clientId, dataType, data) {
    this.reliableTransport(clientId, dataType, data);
  }
  broadcastData(dataType, data) {
    this.unreliableTransport(undefined, dataType, data);
  }
  broadcastDataGuaranteed(dataType, data) {
    this.reliableTransport(undefined, dataType, data);
  }

  disconnect() {
    console.log("Disconnect not yet implemented");
  }

  onData() {
    //TODO: Remove
  }
  setClientId() {
    //TODO: Remove
  }
  setJoinToken() {
    //TODO: Remove
  }
  setServerParams() {
    //TODO: Remove
  }
  setReconnectionListeners() {
    //TODO: Remove
  }
  setTurnConfig() {
    //TODO: Remove
  }
  setLocalMediaStream() {
    //TODO: Remove
  }
  enableMicrophone() {
    //TODO: Remove
  }
  syncOccupants() {
    //TODO: Remove
  }
  getPendingDataForNetworkId() {
    //TODO: Remove
  }
  on() {
    //TODO: Remove
  }
  off() {
    //TODO: Remove
  }
}

NAF.adapters.register("phoenix", PhoenixAdapter);
