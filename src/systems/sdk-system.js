import { World } from "../sdk/internal";

export class SDKSystem {
  constructor() {
    this.enabled = false;

    if (process.env.SDK_ENABLED) {
      this.enabled = true;

      window.world = this.world = new World();

      // Imports the hubs config from the path supplied in process.env.HUBS_CONFIG_PATH
      const hubsConfig = require("hubs-config").default;

      hubsConfig(this.world);
    }
  }

  tick(dt) {
    if (!this.enabled) {
      return;
    }

    if (!this.world.root.parent) {
      const sdkRootEl = document.getElementById("sdk-root");
      sdkRootEl.object3D.add(this.world.root);
    }

    const systems = this.world.systems;

    for (let i = 0; i < systems.length; i++) {
      systems[i].update(dt);
    }
  }
}
