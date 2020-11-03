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
// - look into requestConsumerKeyframe
// - look into applyNetworkThrottle
// SFU todo
// - remove active speaker stuff
// - remove score stuff

// Based upon mediasoup-demo RoomClient

const debug = newDebug("naf-dialog-adapter:debug");
//const warn = newDebug("naf-dialog-adapter:warn");
const error = newDebug("naf-dialog-adapter:error");
const info = newDebug("naf-dialog-adapter:info");

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
    this._pendingMediaRequests = new Map();
    this._micEnabled = true;
    this._initialAudioConsumerPromise = null;
    this._initialAudioConsumerResolvers = new Map();
    this._serverTimeRequests = 0;
    this._avgTimeOffset = 0;
    this._blockedClients = new Map();
    this.type = "dialog";
    this.occupants = {}; // This is a public field
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

    if (peerConnectionConfig.iceTransportPolicy) {
      this._iceTransportPolicy = peerConnectionConfig.iceTransportPolicy;
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

  async connect() {
    const urlWithParams = new URL(this._serverUrl);
    urlWithParams.searchParams.append("roomId", this._roomId);
    urlWithParams.searchParams.append("peerId", this._clientId);

    const protooTransport = new protooClient.WebSocketTransport(urlWithParams.toString());
    this._protoo = new protooClient.Peer(protooTransport);

    await new Promise(res => {
      this._protoo.on("open", async () => {
        this._closed = false;
        await this._joinRoom();
        res();
      });
    });

    this._protoo.on("disconnected", () => this.disconnect());
    this._protoo.on("close", () => this.disconnect());

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

            // We are ready. Answer the protoo request so the server will
            // resume this Consumer (which was paused for now if video).
            accept();

            this.resolvePendingMediaRequestForTrack(peerId, consumer.track);

            if (kind === "audio") {
              const initialAudioResolver = this._initialAudioConsumerResolvers.get(peerId);

              if (initialAudioResolver) {
                initialAudioResolver();
                this._initialAudioConsumerResolvers.delete(peerId);
              }
            }
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
          this.occupants[peer.id] = peer;

          if (this._onOccupantsChanged) {
            this._onOccupantsChanged(this.occupants);
          }

          break;
        }

        case "peerClosed": {
          const { peerId } = notification.data;
          this._onOccupantDisconnected(peerId);

          const pendingMediaRequests = this._pendingMediaRequests.get(peerId);

          if (pendingMediaRequests) {
            const msg = "The user disconnected before the media stream was resolved.";
            info(msg);

            if (pendingMediaRequests.audio) {
              pendingMediaRequests.audio.resolve(null);
            }

            if (pendingMediaRequests.video) {
              pendingMediaRequests.video.resolve(null);
            }

            this._pendingMediaRequests.delete(peerId);
          }

          // Resolve initial audio resolver since this person left.
          const initialAudioResolver = this._initialAudioConsumerResolvers.get(peerId);

          if (initialAudioResolver) {
            initialAudioResolver();

            this._initialAudioConsumerResolvers.delete(peerId);
          }

          delete this.occupants[peerId];

          if (this._onOccupantsChanged) {
            this._onOccupantsChanged(this.occupants);
          }

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

        case "peerBlocked": {
          const { peerId } = notification.data;
          document.body.dispatchEvent(new CustomEvent("blocked", { detail: { clientId: peerId } }));

          break;
        }

        case "peerUnblocked": {
          const { peerId } = notification.data;
          document.body.dispatchEvent(new CustomEvent("unblocked", { detail: { clientId: peerId } }));

          break;
        }
      }
    });

    await Promise.all([this.updateTimeOffset(), this._initialAudioConsumerPromise]);
  }

  shouldStartConnectionTo() {
    return true;
  }
  startStreamConnection() {}

  closeStreamConnection() {}

  resolvePendingMediaRequestForTrack(clientId, track) {
    const requests = this._pendingMediaRequests.get(clientId);

    if (requests && requests[track.kind]) {
      const resolve = requests[track.kind].resolve;
      delete requests[track.kind];
      resolve(new MediaStream([track]));
    }

    if (requests && Object.keys(requests).length === 0) {
      this._pendingMediaRequests.delete(clientId);
    }
  }

  removeConsumer(consumerId) {
    this._consumers.delete(consumerId);
  }

  getConnectStatus(/*clientId*/) {
    return this._protoo.connected ? NAF.adapters.IS_CONNECTED : NAF.adapters.NOT_CONNECTED;
  }

  getMediaStream(clientId, kind = "audio") {
    let track;

    if (this._clientId === clientId) {
      if (kind === "audio" && this._micProducer) {
        track = this._micProducer.track;
      } else if (kind === "video" && this._videoProducer) {
        track = this._videoProducer.track;
      }
    } else {
      this._consumers.forEach(consumer => {
        if (consumer.appData.peerId === clientId && kind == consumer.track.kind) {
          track = consumer.track;
        }
      });
    }

    if (track) {
      debug(`Already had ${kind} for ${clientId}`);
      return Promise.resolve(new MediaStream([track]));
    } else {
      debug(`Waiting on ${kind} for ${clientId}`);
      if (!this._pendingMediaRequests.has(clientId)) {
        this._pendingMediaRequests.set(clientId, {});
      }

      const requests = this._pendingMediaRequests.get(clientId);
      const promise = new Promise((resolve, reject) => (requests[kind] = { resolve, reject }));
      requests[kind].promise = promise;
      promise.catch(e => console.warn(`${clientId} getMediaStream Error`, e));
      return promise;
    }
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
    // Not implemented
  }

  async _joinRoom() {
    debug("_joinRoom()");

    try {
      this._mediasoupDevice = new mediasoupClient.Device({});

      const routerRtpCapabilities = await this._protoo.request("getRouterRtpCapabilities");

      await this._mediasoupDevice.load({ routerRtpCapabilities });

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
        iceTransportPolicy: this._iceTransportPolicy,
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
        sctpCapabilities: this._useDataChannel ? this._mediasoupDevice.sctpCapabilities : undefined,
        token: this._joinToken
      });

      const audioConsumerPromises = [];
      this.occupants = {};

      // Create a promise that will be resolved once we attach to all the initial consumers.
      // This will gate the connection flow until all voices will be heard.
      for (let i = 0; i < peers.length; i++) {
        const peerId = peers[i].id;
        this._onOccupantConnected(peerId);
        this.occupants[peerId] = peers[i];
        if (!peers[i].hasProducers) continue;
        audioConsumerPromises.push(new Promise(res => this._initialAudioConsumerResolvers.set(peerId, res)));
      }

      this._connectSuccess(this._clientId);
      this._initialAudioConsumerPromise = Promise.all(audioConsumerPromises);

      if (this._onOccupantsChanged) {
        this._onOccupantsChanged(this.occupants);
      }

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
    let sawAudio = false;
    let sawVideo = false;

    stream.getTracks().forEach(async track => {
      if (track.kind === "audio") {
        sawAudio = true;

        // TODO multiple audio tracks?
        if (this._micProducer) {
          if (this._micProducer.track !== track) {
            this._micProducer.track.stop();
            this._micProducer.replaceTrack(track);
          }
        } else {
          if (!this._micEnabled) {
            track.enabled = false;
          }

          // stopTracks = false because otherwise the track will end during a temporary disconnect
          this._micProducer = await this._sendTransport.produce({
            track,
            stopTracks: false,
            codecOptions: { opusStereo: false, opusDtx: true }
          });

          this._micProducer.on("transportclose", () => (this._micProducer = null));

          if (!this._micEnabled) {
            this._micProducer.pause();
          }
        }
      } else {
        sawVideo = true;

        if (this._videoProducer) {
          if (this._videoProducer.track !== track) {
            this._videoProducer.track.stop();
            this._videoProducer.replaceTrack(track);
          }
        } else {
          // TODO simulcasting

          // stopTracks = false because otherwise the track will end during a temporary disconnect
          this._videoProducer = await this._sendTransport.produce({
            track,
            stopTracks: false,
            codecOptions: { videoGoogleStartBitrate: 1000 }
          });

          this._videoProducer.on("transportclose", () => (this._videoProducer = null));
        }
      }

      this.resolvePendingMediaRequestForTrack(this._clientId, track);
    });

    if (!sawAudio && this._micProducer) {
      this._micProducer.close();
      this._protoo.request("closeProducer", { producerId: this._micProducer.id });
      this._micProducer = null;
    }

    if (!sawVideo && this._videoProducer) {
      this._videoProducer.close();
      this._protoo.request("closeProducer", { producerId: this._videoProducer.id });
      this._videoProducer = null;
    }

    this._localMediaStream = stream;
  }

  enableMicrophone(enabled) {
    if (this._micProducer) {
      if (enabled) {
        this._micProducer.resume();
      } else {
        this._micProducer.pause();
      }
    }

    this._micEnabled = enabled;
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

    const occupantIds = Object.keys(this.occupants);
    for (let i = 0; i < occupantIds.length; i++) {
      const peerId = occupantIds[i];
      if (peerId === this._clientId) continue;
      this._onOccupantDisconnected(peerId);
    }

    this.occupants = {};

    if (this._onOccupantsChanged) {
      this._onOccupantsChanged(this.occupants);
    }

    debug("disconnect()");

    // Close protoo Peer, though may already be closed if this is happening due to websocket breakdown
    if (this._protoo && this._protoo.connected) {
      this._protoo.close();
    }

    // Close mediasoup Transports.
    if (this._sendTransport) this._sendTransport.close();

    if (this._recvTransport) this._recvTransport.close();
  }

  reconnect() {
    // Dispose of all networked entities and other resources tied to the session.
    this.disconnect();

    this.connect()
      .then(() => {
        this.reconnectionDelay = this.initialReconnectionDelay;
        this.reconnectionAttempts = 0;

        if (this._reconnectedListener) {
          this._reconnectedListener();
        }
      })
      .catch(error => {
        this.reconnectionDelay += 1000;
        this.reconnectionAttempts++;

        if (this.reconnectionAttempts > this.maxReconnectionAttempts && this._reconnectionErrorListener) {
          return this._reconnectionErrorListener(
            new Error("Connection could not be reestablished, exceeded maximum number of reconnection attempts.")
          );
        }

        console.warn("Error during reconnect, retrying.");
        console.warn(error);

        if (this._reconnectingListener) {
          this._reconnectingListener(this.reconnectionDelay);
        }

        this.reconnectionTimeout = setTimeout(() => this.reconnect(), this.reconnectionDelay);
      });
  }

  kick(clientId, permsToken) {
    return this._protoo
      .request("kick", {
        room_id: this.room,
        user_id: clientId,
        token: permsToken
      })
      .then(() => {
        document.body.dispatchEvent(new CustomEvent("kicked", { detail: { clientId: clientId } }));
      });
  }

  block(clientId) {
    return this._protoo.request("block", { whom: clientId }).then(() => {
      this._blockedClients.set(clientId, true);
      document.body.dispatchEvent(new CustomEvent("blocked", { detail: { clientId: clientId } }));
    });
  }

  unblock(clientId) {
    return this._protoo.request("unblock", { whom: clientId }).then(() => {
      this._blockedClients.delete(clientId);
      document.body.dispatchEvent(new CustomEvent("unblocked", { detail: { clientId: clientId } }));
    });
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

    this._serverTimeRequests++;

    if (this._serverTimeRequests <= 10) {
      this._timeOffsets.push(timeOffset);
    } else {
      this._timeOffsets[this._serverTimeRequests % 10] = timeOffset;
    }

    this._avgTimeOffset = this._timeOffsets.reduce((acc, offset) => (acc += offset), 0) / this._timeOffsets.length;

    if (this._serverTimeRequests > 10) {
      debug(`new server time offset: ${this._avgTimeOffset}ms`);
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
    this.flushPendingUpdates();
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

    // Ignore messages from users that we may have blocked while frozen.
    if (data.owner && this._blockedClients.has(data.owner)) return null;

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

      this._onOccupantMessage(null, dataType, data, message.source);
    }
    this._frozenUpdates.clear();
  }

  dataForUpdateMultiMessage(networkId, message) {
    // "d" is an array of entity datas, where each item in the array represents a unique entity and contains
    // metadata for the entity, and an array of components that have been updated on the entity.
    // This method finds the data corresponding to the given networkId.
    for (let i = 0, l = message.data.d.length; i < l; i++) {
      const data = message.data.d[i];

      if (data.networkId === networkId) {
        return data;
      }
    }

    return null;
  }
}

NAF.adapters.register("dialog", DialogAdapter);
