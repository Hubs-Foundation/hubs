import { netcode, denoisePresence } from "./netcode";
import { freeze } from "./freeze";

function transportForChannel(channel) {
  return (clientId, dataType, data) => {
    if (clientId) {
      channel.push("naf", { clientId, dataType, data });
    } else {
      channel.push("naf", { dataType, data });
    }
  };
}

export default class PhoenixAdapter {
  constructor() {
    this.serverUrl = null;
    this.room = null;
    this.openListener = null;
    this.closedListener = null;
    this.messageListener = null;
    this.occupants = []; // TODO: Remove
  }
  setServerUrl(url) {
    this.serverUrl = url;
  }
  setApp() {}
  setRoom(roomName) {
    this.room = roomName;
  }
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
    try {
      const onJoin = (key, meta) => {
        console.log("Joined", key, freeze(meta));
        this.occupants.push(key);
        this.openListener(key);
      };
      const onLeave = (key, meta) => {
        this.occupants.slice(this.occupants.indexOf(key), 1);
        console.log("Left", key, freeze(meta));
        this.closedListener(key);
      };
      const onChange = (key, previous, current) => {
        console.log("Changed", key, freeze(previous), freeze(current));
      };
      const { rawOnJoin, rawOnLeave } = denoisePresence({ onJoin, onLeave, onChange });
      const hubId = "wiHRpou";
      const { channels, sessionId } = (window.net = await netcode({
        protocol: "wss",
        port: "443",
        host: "gallant-dwarf.reticulum.io",
        hubId,
        hubChannelParams: APP.createHubChannelParams(), // TODO
        onHubChannelPresenceSync: function() {},
        onHubChannelPresenceJoin: rawOnJoin,
        onHubChannelPresenceLeave: rawOnLeave
      }));
      const hubChannel = channels.get(`hub:${hubId}`);

      this.sendViaHubChannel = transportForChannel(hubChannel);
      const handleIncomingNAF = message => {
        this.messageListener(null, message.dataType, message.data, "phx-reliable");
      };

      hubChannel.on("naf", handleIncomingNAF);
      hubChannel.on("nafr", ({ from_session_id, naf: unparsedData }) => {
        // Server optimization: server passes through unparsed NAF message, we must now parse it.
        const data = JSON.parse(unparsedData);
        data.from_session_id = from_session_id;
        handleIncomingNAF(data);
      });
      this.successListener(sessionId);
    } catch (e) {
      console.error("Failed to connect to phoenix", e);
      this.failureListener();
    }
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
    this.sendViaHubChannel(clientId, dataType, data);
  }
  sendDataGuaranteed(clientId, dataType, data) {
    this.sendViaHubChannel(clientId, dataType, data);
  }
  broadcastData(dataType, data) {
    this.sendViaHubChannel(undefined, dataType, data);
  }
  broadcastDataGuaranteed(dataType, data) {
    this.sendViaHubChannel(undefined, dataType, data);
  }

  disconnect() {
    console.log("Disconnect not yet implemented");
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
  onData() {
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
