import * as mediasoupClient from "mediasoup-client";
import protooClient from "protoo-client";
import { debug as newDebug } from "debug";

const AVAILABLE_OCCUPANTS_THRESHOLD = 5;
const MAX_SUBSCRIBE_DELAY = 5000;

function randomDelay(min, max) {
  return new Promise(resolve => {
    const delay = Math.random() * (max - min) + min;
    setTimeout(resolve, delay);
  });
}

// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS = [{ scalabilityMode: "S3T3_KEY" }];

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS = [{ scalabilityMode: "S3T3", dtx: true }];

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
// - get connect status
// - migrate all SDP bits
// - microphone muting
// - screenshare start/end
// - video start end
// - make sure works if perms denied
// - restartIce
// - look into requestConsumerKeyframe
// - remove safari hacks
// - look into applyNetworkThrottle
// - test turn
// - checkout encodings in video setup

// Based upon mediasoup-demo RoomClient

const debug = newDebug("naf-dialog-adapter:debug");
//const warn = newDebug("naf-dialog-adapter:warn");
const error = newDebug("naf-dialog-adapter:error");

const PC_PROPRIETARY_CONSTRAINTS = {
  optional: [{ googDscp: true }]
};

export default class DialogAdapter {
  constructor() {
    this._forceTcp = false;
    this._timeOffsets = [];
    this._occupants = {};
    this._occupantIds = {};
    this._pendingOccupants = new Set();
    this._availableOccupants = [];
    this._requestedOccupants = null;
    this._micProducer = null;
    this._videoProducer = null;
    this._mediaStreams = {};
    this._localMediaStream = null;
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
    const urlWithParams = new URL(this._serverUrl);
    urlWithParams.searchParams.append("roomId", this._roomId);
    urlWithParams.searchParams.append("peerId", this._clientId);

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

  getMediaStream(clientId, type = "audio") {
    if (this._mediaStreams[clientId]) {
      debug(`Already had ${type} for ${clientId}`);
      return Promise.resolve(this._mediaStreams[clientId][type]);
    }
    // TODO promise resolution
  }

  getServerTime() {
    return Date.now() + this._avgTimeOffset;
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
        sctpCapabilities: undefined
      });
      console.log(sendTransportInfo);

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

      // Create mediasoup Transport for sending (unless we don't want to consume).
      const recvTransportInfo = await this._protoo.request("createWebRtcTransport", {
        forceTcp: this._forceTcp,
        producing: false,
        consuming: true,
        sctpCapabilities: undefined
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
      this._connectSuccess(this._clientId);

      for (let i = 0; i < peers.length; i++) {
        const occupantId = peers[i].id;
        if (occupantId === this._clientId) continue; // Happens during non-graceful reconnects due to zombie sessions
        this.addAvailableOccupant(occupantId);
      }

      this.syncOccupants();

      if (this._localMediaStream) {
        this.createMissingProducers(this._localMediaStream);
      }
    } catch (err) {
      error("_joinRoom() failed:%o", err);

      this.disconnect();
    }
  }

  setLocalMediaStream(stream) {
    this.createMissingProducers(stream);
  }

  createMissingProducers(stream) {
    if (!this._sendTransport) return;

    stream.getTracks().forEach(async track => {
      if (track.kind === "audio") {
        // TODO multiple audio tracks?
        if (this._micProducer) {
          this._micProducer.replaceTrack(track);
        } else {
          this._micProducer = await this._sendTransport.produce({
            track,
            codecOptions: { opusStereo: false, opusDtx: true }
          });
        }
      } else {
        if (this._videoProducer) {
          this._videoProducer.replaceTrack(track);
        } else {
          // TODO simulcasting
          this._videoProducer = await this._sendTransport.produce({
            track,
            codecOptions: { videoGoogleStartBitrate: 1000 }
          });
        }
      }
    });

    this.setMediaStream(this._clientId, stream);
    this._localMediaStream = stream;
  }

  setMediaStream(clientId, stream) {
    // Safari doesn't like it when you use single a mixed media stream where one of the tracks is inactive, so we
    // split the tracks into two streams.
    const audioStream = new MediaStream();
    try {
      stream.getAudioTracks().forEach(track => audioStream.addTrack(track));
    } catch (e) {
      console.warn(`${clientId} setMediaStream Audio Error`, e);
    }
    const videoStream = new MediaStream();
    try {
      stream.getVideoTracks().forEach(track => videoStream.addTrack(track));
    } catch (e) {
      console.warn(`${clientId} setMediaStream Video Error`, e);
    }

    this._mediaStreams[clientId] = { audio: audioStream, video: videoStream };
  }

  enableMicrophone(enabled) {
    if (this._micProducer) {
      if (enabled) {
        this._micProducer.resume();
      } else {
        this._micProducer.pause();
      }
    }
  }

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

  addAvailableOccupant(occupantId) {
    if (this._availableOccupants.indexOf(occupantId) === -1) {
      this._availableOccupants.push(occupantId);
    }
  }

  removeAvailableOccupant(occupantId) {
    const idx = this._availableOccupants.indexOf(occupantId);
    if (idx !== -1) {
      this._availableOccupants.splice(idx, 1);
    }
  }

  syncOccupants(requestedOccupants) {
    if (requestedOccupants) {
      this._requestedOccupants = requestedOccupants;
    }

    if (!this._requestedOccupants) {
      return;
    }

    // Add any requested, available, and non-pending occupants.
    for (let i = 0; i < this._requestedOccupants.length; i++) {
      const occupantId = this._requestedOccupants[i];
      if (
        !this._occupants[occupantId] &&
        this._availableOccupants.indexOf(occupantId) !== -1 &&
        !this._pendingOccupants.has(occupantId)
      ) {
        this.addOccupant(occupantId);
      }
    }

    // Remove any unrequested and currently added occupants.
    for (let j = 0; j < this._availableOccupants.length; j++) {
      const occupantId = this._availableOccupants[j];
      if (this._occupants[occupantId] && this._requestedOccupants.indexOf(occupantId) === -1) {
        this.removeOccupant(occupantId);
      }
    }

    // Call the Networked AFrame callbacks for the updated occupants list.
    this._onOccupantsChanged(this._occupants);
  }

  async addOccupant(occupantId) {
    this._pendingOccupants.add(occupantId);

    const availableOccupantsCount = this._availableOccupants.length;
    if (availableOccupantsCount > AVAILABLE_OCCUPANTS_THRESHOLD) {
      await randomDelay(0, MAX_SUBSCRIBE_DELAY);
    }

    // TODO subscribe to occupant
    /*const subscriber = await this.createSubscriber(occupantId);
    if (subscriber) {
      if (!this.pendingOccupants.has(occupantId)) {
        subscriber.conn.close();
      } else {
        this.pendingOccupants.delete(occupantId);
        this.occupantIds.push(occupantId);
        this.occupants[occupantId] = subscriber;

        this.setMediaStream(occupantId, subscriber.mediaStream);

        // Call the Networked AFrame callbacks for the new occupant.
        this.onOccupantConnected(occupantId);
      }
    }*/
  }

  removeAllOccupants() {
    this._pendingOccupants.clear();
    for (let i = this.occupantIds.length - 1; i >= 0; i--) {
      this.removeOccupant(this._occupantIds[i]);
    }
  }

  removeOccupant(occupantId) {
    this._pendingOccupants.delete(occupantId);

    if (this._occupants[occupantId]) {
      // Close the subscriber peer connection. Which also detaches the plugin handle.
      // TODO close subscription
      //this._occupants[occupantId].conn.close();
      delete this._occupants[occupantId];

      this._occupantIds.splice(this._occupantIds.indexOf(occupantId), 1);
    }

    // TODO remove
    /*if (this.mediaStreams[occupantId]) {
      delete this.mediaStreams[occupantId];
    }*/

    // TODO deal with pending media requests
    /*if (this.pendingMediaRequests.has(occupantId)) {
      const msg = "The user disconnected before the media stream was resolved.";
      this.pendingMediaRequests.get(occupantId).audio.reject(msg);
      this.pendingMediaRequests.get(occupantId).video.reject(msg);
      this.pendingMediaRequests.delete(occupantId);
    }*/

    // Call the Networked AFrame callbacks for the removed occupant.
    this.onOccupantDisconnected(occupantId);
  }

  toggleFreeze() {
    if (this.frozen) {
      this.unfreeze();
    } else {
      this.freeze();
    }
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
    // TODO
    //this.flushPendingUpdates();
  }
}

NAF.adapters.register("dialog", DialogAdapter);
