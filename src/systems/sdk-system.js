import { HubsWorld } from "../sdk/HubsWorld";

export class SDKSystem {
  constructor(hubsSystems) {
    this.enabled = false;

    if (process.env.SDK_ENABLED) {
      this.enabled = true;

      window.world = this.world = new HubsWorld(hubsSystems);

      // Imports the hubs config from the path supplied in process.env.HUBS_CONFIG_PATH
      const hubsConfig = require("hubs-config").default;

      hubsConfig(this.world);
    }
  }

  tick(dt, time) {
    if (!this.enabled) {
      return;
    }

    if (!this.world.root.parent) {
      const sdkRootEl = document.getElementById("sdk-root");
      sdkRootEl.object3D.add(this.world.root);
    }

    this.world.update(dt, time);
  }
}
