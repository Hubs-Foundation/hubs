import { addComponent, removeComponent, defineQuery } from "bitecs";
import { Interacted, SingleActionButton, HoveredRightRemote, HoveredLeftRemote } from "../utils/jsx-entity";
import { CAMERA_MODE_INSPECT } from "./camera-system";

const interactedQuery = defineQuery([Interacted]);
const rightRemoteQuery = defineQuery([SingleActionButton, HoveredRightRemote]);
const leftRemoteQuery = defineQuery([SingleActionButton, HoveredLeftRemote]);

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

  const userinput = AFRAME.scenes[0].systems.userinput;
  const interaction = AFRAME.scenes[0].systems.interaction;

  const rightEnts = rightRemoteQuery(world);
  if (userinput.get(interaction.options.rightRemote.grabPath)) {
    for (let i = 0; i < rightEnts.length; i++) {
      const eid = rightEnts[i];
      world.eid2obj.get(eid).dispatchEvent({
        type: "interact",
        object3D: interaction.options.rightRemote.entity.object3D
      });
      addComponent(world, Interacted, eid);
    }
  }

  const leftEnts = leftRemoteQuery(world);
  if (userinput.get(interaction.options.leftRemote.grabPath)) {
    for (let i = 0; i < leftEnts.length; i++) {
      const eid = leftEnts[i];
      world.eid2obj.get(eid).dispatchEvent({
        type: "interact",
        object3D: interaction.options.leftRemote.entity.object3D
      });
      addComponent(world, Interacted, eid);
    }
  }
}
