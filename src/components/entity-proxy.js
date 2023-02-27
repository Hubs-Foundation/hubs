import { removeEntity } from "bitecs";
import { EntityProxy } from "../bit-components";

AFRAME.registerComponent("entity-proxy", {
  schema: {
    eid: { type: "number" }
  },

  remove() {
    removeEntity(APP.world, this.data.eid);
    EntityProxy.map.delete(this.data.eid);
  }
});
