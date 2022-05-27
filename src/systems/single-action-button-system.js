import { addComponent, removeComponent, defineQuery } from "bitecs";
import { HoveredRemoteLeft, HoveredRemoteRight, Interacted, SingleActionButton } from "../bit-components";
import { CAMERA_MODE_INSPECT } from "./camera-system";
import { paths } from "./userinput/paths";

const interactedQuery = defineQuery([Interacted]);
const rightRemoteQuery = defineQuery([SingleActionButton, HoveredRemoteRight]);
const leftRemoteQuery = defineQuery([SingleActionButton, HoveredRemoteLeft]);

function interact(world, entities, path, interactor) {
  if (AFRAME.scenes[0].systems.userinput.get(path)) {
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      addComponent(world, Interacted, eid);

      // TODO: New systems should not listen for this event
      // Delete this when we're done interoping with old world systems
      world.eid2obj.get(eid).dispatchEvent({
        type: "interact",
        object3D: interactor
      });
    }
  }
}

export function singleActionButtonSystem(world) {
  // Clear the interactions from previous frames
  const interactedEnts = interactedQuery(world);
  for (let i = 0; i < interactedEnts.length; i++) {
    const eid = interactedEnts[i];
    removeComponent(world, Interacted, eid);
  }

  if (AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT) {
    // TODO: Fix issue where button objects are "visible" but not on the inspect layer,
    // which makes it so we can interact with them but cannot see them.
    return;
  }

  const interaction = AFRAME.scenes[0].systems.interaction;
  interact(
    world,
    leftRemoteQuery(world),
    paths.actions.cursor.left.grab,
    interaction.options.leftRemote.entity.object3D
  );
  interact(
    world,
    rightRemoteQuery(world),
    paths.actions.cursor.right.grab,
    interaction.options.rightRemote.entity.object3D
  );
}
