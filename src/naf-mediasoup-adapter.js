import { debug as newDebug } from "debug";

const debug = newDebug("naf-mediasoup-adapter:debug");
/*const warn = newDebug("naf-mediasoup-adapter:warn");
const error = newDebug("naf-mediasoup-adapter:error");*/

export default class MediasoupAdapater {
  setServerUrl(url) {
    this.serverUrl = url;
  }
  setApp() {}
  setRoom(roomName) {
    this.room = roomName;
  }
  setWebRtcOptions(options) {
    this.webRtcOptions = options;
  }

  setServerConnectListeners(successListener, failureListener) {
    this.connectSuccess = successListener;
    this.connectFailure = failureListener;
  }
  setRoomOccupantListener(occupantListener) {
    this.onOccupantsChanged = occupantListener;
  }
  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.onOccupantConnected = openListener;
    this.onOccupantDisconnected = closedListener;
    this.onOccupantMessage = messageListener;
  }

  connect() {
    console.log("HELLLO");
    this.notImplemented("connect");
    return Promise.all([this.updateTimeOffset()]);
  }
  shouldStartConnectionTo() {
    return true;
  }
  startStreamConnection() {}

  closeStreamConnection() {}
  getConnectStatus(/*clientId*/) {
    this.notImplemented("getConnectStatus");
    //return this.occupants[clientId] ? NAF.adapters.IS_CONNECTED : NAF.adapters.NOT_CONNECTED;
  }

  getMediaStream(/*clientId*/) {
    this.notImplemented("getConnectStatus");
  }

  getServerTime() {
    return Date.now() + this.avgTimeOffset;
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

  isDisconnected() {
    // TODO
    //return this.ws === null;
    return false;
  }

  disconnect() {
    this.notImplemented("disconnect");
  }

  notImplemented() {}

  async updateTimeOffset() {
    if (this.isDisconnected()) return;

    const clientSentTime = Date.now();

    const res = await fetch(document.location.href, {
      method: "HEAD",
      cache: "no-cache"
    });

    const precision = 1000;
    const serverReceivedTime = new Date(res.headers.get("Date")).getTime() + precision / 2;
    const clientReceivedTime = Date.now();
    const serverTime = serverReceivedTime + (clientReceivedTime - clientSentTime) / 2;
    const timeOffset = serverTime - clientReceivedTime;

    this.serverTimeRequests++;

    if (this.serverTimeRequests <= 10) {
      this.timeOffsets.push(timeOffset);
    } else {
      this.timeOffsets[this.serverTimeRequests % 10] = timeOffset;
    }

    this.avgTimeOffset = this.timeOffsets.reduce((acc, offset) => (acc += offset), 0) / this.timeOffsets.length;

    if (this.serverTimeRequests > 10) {
      debug(`new server time offset: ${this.avgTimeOffset}ms`);
      setTimeout(() => this.updateTimeOffset(), 5 * 60 * 1000); // Sync clock every 5 minutes.
    } else {
      this.updateTimeOffset();
    }
  }
}

NAF.adapters.register("mediasoup", MediasoupAdapater);
