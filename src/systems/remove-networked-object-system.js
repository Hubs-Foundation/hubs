import { removeNetworkedObject } from "../utils/removeNetworkedObject";
import { RemoveNetworkedEntityButton, Interacted } from "../utils/jsx-entity";
import { findAncestorWithComponent } from "../utils/scene-graph";
import { defineQuery } from "bitecs";

const query = defineQuery([RemoveNetworkedEntityButton, Interacted]);

export function removeNetworkedObjectSystem(world) {
  const ents = query(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const button = world.eid2obj.get(eid);
    const networkedEntity = findAncestorWithComponent(button.el, "networked");
    removeNetworkedObject(networkedEntity.sceneEl, networkedEntity);
    button.parent.visible = false;
  }
}
