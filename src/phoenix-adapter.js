import { netcode, denoisePresence } from "./netcode";
import { freeze } from "./freeze";
import { emitter } from "./emitter";
import { transportForChannel } from "./transport-for-channel";

const events = emitter();
function presenceEventsForHub(hubId) {
  const onJoin = (key, meta) => {
    events.trigger(`hub:${hubId}:join`, { key, meta });
  };
  const onLeave = (key, meta) => {
    events.trigger(`hub:${hubId}:leave`, { key, meta });
  };
  const onChange = (key, previous, current) => {
    events.trigger(`hub:${hubId}:change`, { key, previous, current });
  };
  return {
    onJoin,
    onLeave,
    onChange
  };
}

const hubId = "wiHRpou";
const { rawOnJoin, rawOnLeave } = denoisePresence(presenceEventsForHub(hubId));
const connectPromise = netcode({
  protocol: "wss",
  port: "443",
  host: "gallant-dwarf.reticulum.io",
  hubId,
  hubChannelParams: {
    profile: null,
    push_subscription_endpoint: null,
    auth_token: null,
    perms_token: null,
    context: {
      mobile: false,
      embed: null
    },
    hub_invite_id: null
  }, // TODO: Insert real hub channel join params
  onHubChannelPresenceSync: () => {},
  onHubChannelPresenceJoin: rawOnJoin,
  onHubChannelPresenceLeave: rawOnLeave
});

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
    let channels;
    let sessionId;
    let hubChannelPresence;
    try {
      const data = await connectPromise;
      window.net = data; // TODO: Remove
      channels = data.channels;
      sessionId = data.sessionId;
      hubChannelPresence = data.hubChannelPresence;
    } catch (e) {
      console.error("Failed to connect to phoenix", e);
      this.failureListener();
    }
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
    hubChannelPresence.list().forEach((key, meta) => {
      console.log("Adding existing occupant", { key }, key, freeze(meta));
      this.occupants.push(key);
      this.openListener(key);
    });
    events.on(`hub:${hubId}:join`, ({ key, meta }) => {
      console.log("Occupant joined", key, freeze(meta));
      this.occupants.push(key);
      this.openListener(key);
    });
    events.on(`hub:${hubId}:leave`, ({ key, meta }) => {
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
