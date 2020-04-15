import { System } from "../System";
import { NetworkedComponent } from "../components";

export class NetworkingSystem extends System {
  constructor(world) {
    super(world);

    this.lastUpdate = 0;
    this.data = {};
    this.message = { sender: null, data: {} };
    NAF.connection.dataChannelSubs.e = this.onMessageReceived;
  }

  onMessageReceived = (fromClientId, dataType, data, source) => {
    console.log(fromClientId, dataType, data, source);
  };

  update(dt, time) {
    if (!NAF.connection.isConnected()) {
      return;
    }

    const networkedEntities = this.world.entitiesByComponent.get(NetworkedComponent);

    networkedEntities.forEach(entity => {
      const networked = entity.getComponent(NetworkedComponent);

      if (networked.owner === "scene") {
        networked.owner = NAF.clientId;
      }

      if (networked.owner === NAF.clientId) {
        this.data[networked.id] = networked.data;
        this.needsUpdate = true;
      }
    });

    if (this.needsUpdate && time - this.lastUpdate > NAF.options.updateRate) {
      this.lastUpdate = time;
      this.message.sender = NAF.clientId;
      NAF.connection.broadcastData("e", this.message);
      this.needsUpdate = false;
    }
  }
}
