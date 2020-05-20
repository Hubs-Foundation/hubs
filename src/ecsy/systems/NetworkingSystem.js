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
  outgoingFirstSyncs: [],
  outgoingUpdates: []
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
        const template = networkingState.templates[entity.template];
        template.disposeEntity(entity);
        delete networkingState.entities[networkId];
      } else {
        console.warn(`Tried to remove unknown networked entity with id: "${networkId}".`);
      }
    }

    // TODO: Handle disconnect and reconnect send/destroy entities
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

      let lastSentData;
      let isFirstSync;

      if (!networkingState.entities[networkId]) {
        isFirstSync = true;
        networkingState.entities[networkId] = entity;
        lastSentData = networkingState.lastSentData[networkId] = {};
      } else {
        lastSentData = networkingState.lastSentData[networkId];
      }

      // Gather the updated data for the entity. For the first sync this should include all data.
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

        if (isFirstSync) {
          messageQueues.outgoingFirstSyncs.push(message);
        } else {
          messageQueues.outgoingUpdates.push(message);
        }

        // Note: We only do a shallow copy of the data into the lastSentData. Keep your data flat.
        Object.assign(networkingState.lastSentData[networkId], data);
      }
    }

    const removedNetworkedEntities = this.queries.networkedEntities.removed;

    for (let i = removedNetworkedEntities.length - 1; i >= 0; i--) {
      const entity = removedNetworkedEntities[i];
      const { networkId } = entity.getRemovedComponent(Networked);
      delete networkingState.entities[networkId];
      NAF.connection.broadcastData("r", { networkId, e: true });
    }

    if (messageQueues.outgoingFirstSyncs.length > 0) {
      while (messageQueues.outgoingFirstSyncs.length > 0) {
        const message = messageQueues.outgoingFirstSyncs.shift();
        message.e = true;
        NAF.connection.broadcastData("u", message);
      }
    }

    if (messageQueues.outgoingUpdates.length > 0 && time - networkingState.lastUpdate > NAF.options.updateRate) {
      NAF.connection.broadcastData("um", { d: messageQueues.outgoingUpdates, e: true });
      networkingState.lastUpdate = time;
      messageQueues.outgoingUpdates.length = 0;
    }
  }
}
