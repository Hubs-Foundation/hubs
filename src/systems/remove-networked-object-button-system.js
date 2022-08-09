import { removeNetworkedObject } from "../utils/removeNetworkedObject";
import { findAncestorWithComponent } from "../utils/scene-graph";
import { defineQuery } from "bitecs";
import { Interacted, RemoveNetworkedEntityButton } from "../bit-components";

const query = defineQuery([RemoveNetworkedEntityButton, Interacted]);

export function removeNetworkedObjectButtonSystem(world) {
  const ents = query(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const button = world.eid2obj.get(eid);
    const networkedEntity = findAncestorWithComponent(button.el, "networked");
    removeNetworkedObject(networkedEntity.sceneEl, networkedEntity);
    button.parent.visible = false;
  }
}
