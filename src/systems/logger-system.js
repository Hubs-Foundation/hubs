import { defineQuery, hasComponent } from "bitecs";
import { Interacted, Logger } from "../bit-components";

const query = defineQuery([Logger]);
export function loggerSystem(world) {
  const eids = query(world);
  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const data = world.eid2loggerdata.get(eid);
    data.buttons.forEach(button => {
      if (hasComponent(world, Interacted, button.ref.current)) {
        console.log(`Button ${button.ref.current} was clicked.`);
      }
    });
  }
}
