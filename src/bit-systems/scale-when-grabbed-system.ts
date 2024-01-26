import { defineQuery, entityExists, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Held, HeldRemoteLeft, HeldRemoteRight } from "../bit-components";
import { UserInputSystem } from "aframe";
import { paths } from "../systems/userinput/paths";

const heldQuery = defineQuery([Held]);
export function scaleWhenGrabbedSystem(world: HubsWorld, userInput: UserInputSystem) {
  heldQuery(world).forEach(eid => {
    let deltaScale: number = 0;
    if (hasComponent(world, HeldRemoteRight, eid)) {
      deltaScale = userInput.get(paths.actions.cursor.right.scaleGrabbedGrabbable);
    }
    if (hasComponent(world, HeldRemoteLeft, eid)) {
      deltaScale = userInput.get(paths.actions.cursor.left.scaleGrabbedGrabbable);
    }
    if (!deltaScale) return;
    const obj = world.eid2obj.get(eid)!;
    obj.scale.addScalar(deltaScale).clampScalar(0.1, 100);
    obj.matrixNeedsUpdate = true;
  });
}
