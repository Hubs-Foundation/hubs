import * as mediasoupClient from "mediasoup-client";
import protooClient from "protoo-client";
import { debug as newDebug } from "debug";

// NOTE this adapter does not properly fire the onOccupantsReceived events since those are only needed for
// data channels, which are not yet supported. To fire that event, this class would need to keep a list of
// occupants around and manage it.
//
// Used for VP9 webcam video.
//const VIDEO_KSVC_ENCODINGS = [{ scalabilityMode: "S3T3_KEY" }];

// Used for VP9 desktop sharing.
//const VIDEO_SVC_ENCODINGS = [{ scalabilityMode: "S3T3", dtx: true }];

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
    this._micProducer = null;
    this._videoProducer = null;
    this._mediaStreams = {};
    this._localMediaStream = null;
    this._consumers = new Map();
    this._frozenUpdates = new Map();
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

    this._protoo.on("disconnected", () => {
      this._closed = true;

      if (this._sendTransport) {
        this._sendTransport.close();
        this._sendTransport = null;
      }

      if (this._recvTransport) {
        this._recvTransport.close();
        this._recvTransport = null;
      }
    });

    this._protoo.on("close", () => {
      this.close();
    });

    // eslint-disable-next-line no-unused-vars
    this._protoo.on("request", async (request, accept, reject) => {
      debug('proto "request" event [method:%s, data:%o]', request.method, request.data);

      switch (request.method) {
        case "newConsumer": {
          const {
            peerId,
            producerId,
            id,
            kind,
            rtpParameters,
            /*type, */ appData /*, producerPaused */
          } = request.data;

          try {
            const consumer = await this._recvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
              appData: { ...appData, peerId } // Trick.
            });

            // Store in the map.
            this._consumers.set(consumer.id, consumer);

            consumer.on("transportclose", () => this.removeConsumer(consumer.id));

            this.setMediaStreamTrack(peerId, consumer.track);

            // We are ready. Answer the protoo request so the server will
            // resume this Consumer (which was paused for now if video).
            accept();
          } catch (err) {
            error('"newConsumer" request failed:%o', err);

            throw err;
          }

          break;
        }
      }
    });

    this._protoo.on("notification", notification => {
      debug('proto "notification" event [method:%s, data:%o]', notification.method, notification.data);

      switch (notification.method) {
        case "newPeer": {
          const peer = notification.data;
          this._onOccupantConnected(peer.id);

          break;
        }

        case "peerClosed": {
          const { peerId } = notification.data;
          this._onOccupantDisconnected(peerId);

          break;
        }

        case "consumerClosed": {
          const { consumerId } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer) break;

          consumer.close();
          this.removeConsumer(consumer.id);

          break;
        }
      }
    });

    //this._protoo.on('open', () => this._joinRoom());
    return Promise.all([this.updateTimeOffset()]);
  }
  shouldStartConnectionTo() {
    return true;
  }
  startStreamConnection() {}

  closeStreamConnection() {}

  removeConsumer(consumerId) {
    // TODO remove tracks from local media streams if needed, might not since they'll just be dead tracks.
    this._consumers.delete(consumerId);
  }

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

  syncOccupants() {
    // Ignored
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

      await this._protoo.request("join", {
        displayName: this._clientId,
        device: this._device,
        rtpCapabilities: this._mediasoupDevice.rtpCapabilities,
        sctpCapabilities: this._useDataChannel ? this._mediasoupDevice.sctpCapabilities : undefined
      });

      this._connectSuccess(this._clientId);

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

  setMediaStreamTrack(clientId, track) {
    const stream = new MediaStream();
    stream.addTrack(track);

    if (this._mediaStreams[clientId]) {
      const { video, audio } = this._mediaStreams[clientId];

      if (track.kind === "video") {
        audio.getAudioTracks().forEach(track => stream.addTrack(track));
      } else {
        video.getVideoTracks().forEach(track => stream.addTrack(track));
      }
    }

    this.setMediaStream(clientId, stream);
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

  storeMessage(message) {
    if (message.dataType === "um") {
      // UpdateMulti
      for (let i = 0, l = message.data.d.length; i < l; i++) {
        this.storeSingleMessage(message, i);
      }
    } else {
      this.storeSingleMessage(message);
    }
  }

  storeSingleMessage(message, index) {
    const data = index !== undefined ? message.data.d[index] : message.data;
    const dataType = message.dataType;

    const networkId = data.networkId;

    if (!this._frozenUpdates.has(networkId)) {
      this._frozenUpdates.set(networkId, message);
    } else {
      const storedMessage = this._frozenUpdates.get(networkId);
      const storedData =
        storedMessage.dataType === "um" ? this.dataForUpdateMultiMessage(networkId, storedMessage) : storedMessage.data;

      // Avoid updating components if the entity data received did not come from the current owner.
      const isOutdatedMessage = data.lastOwnerTime < storedData.lastOwnerTime;
      const isContemporaneousMessage = data.lastOwnerTime === storedData.lastOwnerTime;
      if (isOutdatedMessage || (isContemporaneousMessage && storedData.owner > data.owner)) {
        return;
      }

      if (dataType === "r") {
        const createdWhileFrozen = storedData && storedData.isFirstSync;
        if (createdWhileFrozen) {
          // If the entity was created and deleted while frozen, don't bother conveying anything to the consumer.
          this._frozenUpdates.delete(networkId);
        } else {
          // Delete messages override any other messages for this entity
          this._frozenUpdates.set(networkId, message);
        }
      } else {
        // merge in component updates
        if (storedData.components && data.components) {
          Object.assign(storedData.components, data.components);
        }
      }
    }
  }

  onDataChannelMessage(e, source) {
    this.onData(JSON.parse(e.data), source);
  }

  onData(message, source) {
    if (debug.enabled) {
      debug(`DC in: ${message}`);
    }

    if (!message.dataType) return;

    message.source = source;

    if (this.frozen) {
      this.storeMessage(message);
    } else {
      this._onOccupantMessage(null, message.dataType, message.data, message.source);
    }
  }

  getPendingData(networkId, message) {
    if (!message) return null;

    const data = message.dataType === "um" ? this.dataForUpdateMultiMessage(networkId, message) : message.data;

    // Ignore messages relating to users who have disconnected since freezing, their entities
    // will have aleady been removed by NAF.
    // Note that delete messages have no "owner" so we have to check for that as well.
    if (data.owner && !this.occupants[data.owner]) return null;

    // Ignore messages from users that we may have blocked while frozen.
    if (data.owner && this.blockedClients.has(data.owner)) return null;

    return data;
  }

  // Used externally
  getPendingDataForNetworkId(networkId) {
    return this.getPendingData(networkId, this._frozenUpdates.get(networkId));
  }

  flushPendingUpdates() {
    for (const [networkId, message] of this._frozenUpdates) {
      const data = this.getPendingData(networkId, message);
      if (!data) continue;

      // Override the data type on "um" messages types, since we extract entity updates from "um" messages into
      // individual frozenUpdates in storeSingleMessage.
      const dataType = message.dataType === "um" ? "u" : message.dataType;

      this.onOccupantMessage(null, dataType, data, message.source);
    }
    this._frozenUpdates.clear();
  }
}

NAF.adapters.register("dialog", DialogAdapter);
