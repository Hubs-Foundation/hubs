import * as mediasoupClient from "mediasoup-client";
import protooClient from "protoo-client";
import { debug as newDebug } from "debug";
// TODO
// - freeze mode buffering
// - selective subscribe
// - reconnecting
// - auth token
// - kick
// - block
// - safari autoplay
// - check for unneeded event listers
// - properly format data for onOccupantsChanged
// - properly remove occupants on disconnect
// - graceful rollover logic to new server
// - startup await on join

// Based upon mediasoup-demo RoomClient

const debug = newDebug("naf-mediasoup-adapter:debug");
//const warn = newDebug("naf-mediasoup-adapter:warn");
const error = newDebug("naf-mediasoup-adapter:error");

const PC_PROPRIETARY_CONSTRAINTS = {
  optional: [{ googDscp: true }]
};

export default class DialogAdapter {
  constructor() {
    this._forceTcp = false;
    this._useDataChannel = false;
    this._timeOffsets = [];
  }

  setForceTcp(forceTcp) {
    this._forceTcp = forceTcp;
  }

  setServerUrl(url) {
    this._serverUrl = url;
  }

  setJoinToken(joinToken) {
    this._joinToken = joinToken;
  }

  setPeerConnectionConfig(peerConnectionConfig) {
    if (peerConnectionConfig.iceServers) {
      this._iceServers = peerConnectionConfig.iceServers;
    }
  }

  setApp() {}

  setRoom(roomId) {
    this._roomId = roomId;
  }

  setClientId(clientId) {
    this._clientId = clientId;
  }

  setServerConnectListeners(successListener, failureListener) {
    this._connectSuccess = successListener;
    this._connectFailure = failureListener;
  }

  setRoomOccupantListener(occupantListener) {
    this._onOccupantsChanged = occupantListener;
  }

  setDataChannelListeners(openListener, closedListener, messageListener) {
    this._onOccupantConnected = openListener;
    this._onOccupantDisconnected = closedListener;
    this._onOccupantMessage = messageListener;
  }

  connect() {
    console.log(this._serverUrl);
    const urlWithParams = new URL(this._serverUrl);
    urlWithParams.searchParams.append("roomId", this._roomId);
    urlWithParams.searchParams.append("peerId", this._clientId);
    console.log(urlWithParams.toString());

    const protooTransport = new protooClient.WebSocketTransport(urlWithParams.toString());
    this._protoo = new protooClient.Peer(protooTransport);
    this._protoo.on("open", () => this._joinRoom());

    //this._protoo.on('open', () => this._joinRoom());
    return Promise.all([this.updateTimeOffset()]);
  }
  shouldStartConnectionTo() {
    return true;
  }
  startStreamConnection() {}

  closeStreamConnection() {}
  getConnectStatus(/*clientId*/) {
    this._notImplemented("getConnectStatus");
    //return this.occupants[clientId] ? NAF.adapters.IS_CONNECTED : NAF.adapters.NOT_CONNECTED;
  }

  getMediaStream(/*clientId*/) {
    this._notImplemented("getConnectStatus");
  }

  getServerTime() {
    return Date.now() + this._avgTimeOffset;
  }

  sendData(clientId, dataType, data) {
    this._unreliableTransport(clientId, dataType, data);
  }
  sendDataGuaranteed(clientId, dataType, data) {
    this._reliableTransport(clientId, dataType, data);
  }
  broadcastData(dataType, data) {
    this._unreliableTransport(undefined, dataType, data);
  }
  broadcastDataGuaranteed(dataType, data) {
    this._reliableTransport(undefined, dataType, data);
  }

  setReconnectionListeners(reconnectingListener, reconnectedListener, reconnectionErrorListener) {
    this._reconnectingListener = reconnectingListener;
    this._reconnectedListener = reconnectedListener;
    this._reconnectionErrorListener = reconnectionErrorListener;
  }

  notImplemented() {}

  async _joinRoom() {
    debug("_joinRoom()");

    try {
      this._mediasoupDevice = new mediasoupClient.Device({});

      const routerRtpCapabilities = await this._protoo.request("getRouterRtpCapabilities");

      await this._mediasoupDevice.load({ routerRtpCapabilities });

      // NOTE: Stuff to play remote audios due to browsers' new autoplay policy.
      //
      // Just get access to the mic and DO NOT close the mic track for a while.
      // Super hack!
      // TODO only do this on safari?
      /*{
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = stream.getAudioTracks()[0];

        audioTrack.enabled = false;

        setTimeout(() => audioTrack.stop(), 120000);
      }*/

      // Create mediasoup Transport for sending (unless we don't want to produce).
      const sendTransportInfo = await this._protoo.request("createWebRtcTransport", {
        forceTcp: this._forceTcp,
        producing: true,
        consuming: false,
        sctpCapabilities: this._useDataChannel ? this._mediasoupDevice.sctpCapabilities : undefined
      });

      this._sendTransport = this._mediasoupDevice.createSendTransport({
        id: sendTransportInfo.id,
        iceParameters: sendTransportInfo.iceParameters,
        iceCandidates: sendTransportInfo.iceCandidates,
        dtlsParameters: sendTransportInfo.dtlsParameters,
        sctpParameters: sendTransportInfo.sctpParameters,
        iceServers: this._iceServers,
        proprietaryConstraints: PC_PROPRIETARY_CONSTRAINTS
      });

      this._sendTransport.on("connect", (
        { dtlsParameters },
        callback,
        errback // eslint-disable-line no-shadow
      ) => {
        this._protoo
          .request("connectWebRtcTransport", {
            transportId: this._sendTransport.id,
            dtlsParameters
          })
          .then(callback)
          .catch(errback);
      });

      this._sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          // eslint-disable-next-line no-shadow
          const { id } = await this._protoo.request("produce", {
            transportId: this._sendTransport.id,
            kind,
            rtpParameters,
            appData
          });

          callback({ id });
        } catch (error) {
          errback(error);
        }
      });

      this._sendTransport.on(
        "producedata",
        async ({ sctpStreamParameters, label, protocol, appData }, callback, errback) => {
          debug('"producedata" event: [sctpStreamParameters:%o, appData:%o]', sctpStreamParameters, appData);

          try {
            // eslint-disable-next-line no-shadow
            const { id } = await this._protoo.request("produceData", {
              transportId: this._sendTransport.id,
              sctpStreamParameters,
              label,
              protocol,
              appData
            });

            callback({ id });
          } catch (error) {
            errback(error);
          }
        }
      );

      // Create mediasoup Transport for sending (unless we don't want to consume).
      const recvTransportInfo = await this._protoo.request("createWebRtcTransport", {
        forceTcp: this._forceTcp,
        producing: false,
        consuming: true,
        sctpCapabilities: this._useDataChannel ? this._mediasoupDevice.sctpCapabilities : undefined
      });

      this._recvTransport = this._mediasoupDevice.createRecvTransport({
        id: recvTransportInfo.id,
        iceParameters: recvTransportInfo.iceParameters,
        iceCandidates: recvTransportInfo.iceCandidates,
        dtlsParameters: recvTransportInfo.dtlsParameters,
        sctpParameters: recvTransportInfo.sctpParameters,
        iceServers: this._iceServers
      });

      this._recvTransport.on("connect", (
        { dtlsParameters },
        callback,
        errback // eslint-disable-line no-shadow
      ) => {
        this._protoo
          .request("connectWebRtcTransport", {
            transportId: this._recvTransport.id,
            dtlsParameters
          })
          .then(callback)
          .catch(errback);
      });

      const { peers } = await this._protoo.request("join", {
        displayName: this._clientId,
        device: this._device,
        rtpCapabilities: this._mediasoupDevice.rtpCapabilities,
        sctpCapabilities: this._useDataChannel ? this._mediasoupDevice.sctpCapabilities : undefined
      });

      this._onOccupantsChanged(peers);
    } catch (err) {
      error("_joinRoom() failed:%o", err);

      this.disconnect();
    }
  }

  setLocalMediaStream(mediaStream) {}

  setWebRtcOptions() {
    // Not implemented
  }

  isDisconnected() {
    return !this._protoo.connected;
  }

  disconnect() {
    if (this._closed) return;

    this._closed = true;

    debug("close()");

    // Close protoo Peer
    this._protoo.close();

    // Close mediasoup Transports.
    if (this._sendTransport) this._sendTransport.close();

    if (this._recvTransport) this._recvTransport.close();

    // TODO call removeOccupant on all the occupants
  }

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

NAF.adapters.register("dialog", DialogAdapter);
