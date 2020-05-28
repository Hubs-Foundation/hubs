import { System } from "ecsy";
import { NetworkingState } from "../components/NetworkingState";
import { Networked } from "../components/Networked";
import { SceneRootTag } from "../components/SceneRootTag";
import "networked-aframe/src/index";

// Route messages to onMessageReceived when "e" is true, otherwise use original NAF handler.
const dataChannelSubs = NAF.connection.dataChannelSubs;

const originalDataChannelSubs = {
  ...dataChannelSubs
};

const messageQueues = {
  removeEntity: [],
  updateEntity: [],
  outgoingClientSyncs: [],
  outgoingFullSyncs: [],
  outgoingPartialUpdates: []
};

const onMessageReceived = (_fromClientId, dataType, data, _source) => {
  // TODO: Do we want this?
  // if (NAF.options.syncSource && source !== NAF.options.syncSource) return;

  // if (NAF.options.firstSyncSource && source !== NAF.options.firstSyncSource) {
  //   NAF.log.write("Ignoring first sync from disallowed source", source);
  //   return;
  // }

  switch (dataType) {
    case "u":
      messageQueues.updateEntity.push(data);
      break;
    case "um":
      for (let i = 0; i < data.d.length; i++) {
        messageQueues.updateEntity.push(data.d[i]);
      }
      break;
    case "r":
      messageQueues.removeEntity.push(data);
      break;
  }
};

const handler = (fromClientId, dataType, data, source) => {
  if (data.e) {
    onMessageReceived(fromClientId, dataType, data, source);
  } else {
    originalDataChannelSubs[dataType](fromClientId, dataType, data, source);
  }
};

dataChannelSubs.um = handler;
dataChannelSubs.u = handler;
dataChannelSubs.r = handler;

function takeOwnership(entity) {
  const networked = entity.getMutableComponent(Networked);
  const owner = networked.owner;
  const lastOwnerTime = networked.lastOwnerTime;
  const now = NAF.connection.getServerTime();

  if (owner && owner !== NAF.clientId && lastOwnerTime < now) {
    networked.lastOwnerTime = now;
    networked.owner = NAF.clientId;
    networked.needsFullSync = true;
    return true;
  }

  return false;
}

export class NetworkingReceiveSystem extends System {
  static queries = {
    networkingState: {
      components: [NetworkingState]
    },
    networkedEntities: {
      components: [Networked]
    },
    sceneRootEntities: {
      components: [SceneRootTag]
    }
  };

  constructor(world, params) {
    super(world, params);

    // TODO: Systems need a dispose method where we remove these event listeners
    document.body.addEventListener("clientDisconnected", this.onClientDisconnected);

    this.disconnectedClients = [];
  }

  onClientDisconnected = event => {
    const clientId = event.detail.clientId;
    this.disconnectedClients.push(clientId);
    console.log("client disconnected", clientId);
  };

  execute() {
    if (!NAF.connection.isConnected()) {
      return;
    }

    const networkingState = this.queries.networkingState.results[0].getMutableComponent(NetworkingState);
    const sceneRootEntity = this.queries.sceneRootEntities.results[0];

    while (messageQueues.updateEntity.length > 0) {
      const message = messageQueues.updateEntity.shift();
      const templateId = message.template;
      const template = networkingState.templates[templateId];

      if (!template) {
        console.warn(`Tried to update entity with unknown network template with id: "${templateId}"`);
        continue;
      }

      const networkId = message.networkId;
      let entity = networkingState.entities[networkId];

      if (!entity) {
        entity = template.createRemoteEntity(this.world);
        entity.addComponent(Networked, {
          networkId,
          creator: message.creator,
          owner: message.owner,
          template: templateId
        });
        networkingState.entities[networkId] = entity;
        sceneRootEntity.add(entity);
      }

      template.updateEntity(entity, message.data);
    }

    while (messageQueues.removeEntity.length > 0) {
      const message = messageQueues.removeEntity.shift();
      const networkId = message.networkId;
      const entity = networkingState.entities[networkId];

      if (entity) {
        const networked = entity.getComponent(Networked);
        const template = networkingState.templates[networked.template];
        template.disposeEntity(entity);
        delete networkingState.entities[networkId];
      } else {
        console.warn(`Tried to remove unknown networked entity with id: "${networkId}".`);
      }
    }

    const networkedEntities = this.queries.networkedEntities.results;

    for (let i = networkedEntities.length - 1; i >= 0; i--) {
      const entity = networkedEntities[i];
      const networked = entity.getComponent(Networked);

      for (let i = 0; i < this.disconnectedClients.length; i++) {
        const clientId = this.disconnectedClients[i];

        if (networked.creator === clientId) {
          const persist = networked.persistent && (networked.owner === NAF.clientId || takeOwnership(networked));

          console.log("removing entity after disconnect", clientId, persist);

          if (!persist) {
            const template = networkingState.templates[networked.template];
            template.disposeEntity(entity);
            delete networkingState.entities[networked.networkId];
          }
        }
      }
    }
  }
}

export class NetworkingSendSystem extends System {
  static queries = {
    networkingState: {
      components: [NetworkingState]
    },
    networkedEntities: {
      components: [Networked],
      listen: {
        removed: true
      }
    }
  };

  constructor(world, params) {
    super(world, params);

    // TODO: Systems need a dispose method where we remove these event listeners
    document.body.addEventListener("clientConnected", this.onClientConnected);
    document.body.addEventListener("clientDisconnected", this.onClientDisconnected);

    this.connectedClients = [];
    this.disconnectedClients = [];
    this.entitiesToRemove = [];
  }

  onClientConnected = event => {
    const clientId = event.detail.clientId;
    this.connectedClients.push(clientId);
  };

  execute(_dt, time) {
    if (!NAF.connection.isConnected()) {
      return;
    }

    const networkingState = this.queries.networkingState.results[0].getMutableComponent(NetworkingState);

    const networkedEntities = this.queries.networkedEntities.results;

    for (let i = 0; i < networkedEntities.length; i++) {
      const entity = networkedEntities[i];
      const networked = entity.getComponent(Networked);

      if (networked.owner !== NAF.clientId) {
        continue;
      }

      const templateId = networked.template;
      const template = networkingState.templates[templateId];

      if (!template) {
        continue;
      }

      const networkId = networked.networkId;

      let isFirstSync = false;
      let isFullSync = false;

      if (!networkingState.entities[networkId]) {
        isFirstSync = true;
        isFullSync = true;
        networkingState.entities[networkId] = entity;
      }

      if (networked.needsFullSync) {
        isFullSync = true;
      }

      let lastSentData;

      if (isFullSync) {
        lastSentData = networkingState.lastSentData[networkId] = {};
      } else {
        lastSentData = networkingState.lastSentData[networkId];
      }

      // Gather the updated data for the entity. For the first sync or full syncs this should include all data.
      // data will be undefined if there is no update.
      const data = template.gatherEntityData(entity, lastSentData);

      if (data) {
        const message = {
          networkId,
          creator: networked.creator,
          owner: networked.owner,
          template: templateId,
          persistent: false,
          isFirstSync,
          data
        };

        if (isFullSync) {
          // console.log("sending full sync");
          messageQueues.outgoingFullSyncs.push(message);
        } else {
          // console.log("sending partial update");
          messageQueues.outgoingPartialUpdates.push(message);
        }

        // Note: We only do a shallow copy of the data into the lastSentData. Keep your data flat.
        Object.assign(networkingState.lastSentData[networkId], data);
      }

      if (!isFullSync) {
        for (let i = 0; i < this.connectedClients.length; i++) {
          const clientId = this.connectedClients[i];
          // Avoid re-gathering data by using last sent data
          const data = networkingState.lastSentData[networkId];

          console.log("outgoing client sync");

          messageQueues.outgoingClientSyncs.push({
            targetClientId: clientId,
            data: {
              networkId,
              creator: networked.creator,
              owner: networked.owner,
              template: templateId,
              persistent: false,
              isFirstSync,
              data
            }
          });
        }
      }
    }

    for (let i = 0; i < this.entitiesToRemove.length; i++) {
      this.entitiesToRemove[i].dispose();
    }

    const removedNetworkedEntities = this.queries.networkedEntities.removed;

    for (let i = removedNetworkedEntities.length - 1; i >= 0; i--) {
      const entity = removedNetworkedEntities[i];
      const { networkId, owner } = entity.getRemovedComponent(Networked);
      delete networkingState.entities[networkId];

      if (owner === NAF.clientId) {
        NAF.connection.broadcastData("r", { networkId, e: true });
      }
    }

    while (messageQueues.outgoingClientSyncs > 0) {
      const message = messageQueues.outgoingFullSyncs.shift();
      message.data.e = true;
      NAF.connection.sendDataGuaranteed(message.targetClientId, "u", message.data);
    }

    while (messageQueues.outgoingFullSyncs.length > 0) {
      const message = messageQueues.outgoingFullSyncs.shift();
      message.e = true;
      NAF.connection.broadcastData("u", message);
    }

    if (messageQueues.outgoingPartialUpdates.length > 0 && time - networkingState.lastUpdate > NAF.options.updateRate) {
      NAF.connection.broadcastData("um", { d: messageQueues.outgoingPartialUpdates, e: true });
      networkingState.lastUpdate = time;
      messageQueues.outgoingPartialUpdates.length = 0;
    }

    this.connectedClients.length = 0;
    this.disconnectedClients.length = 0;
    this.entitiesToRemove.length = 0;
  }
}
