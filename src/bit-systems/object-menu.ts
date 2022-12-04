import { UserInputSystem } from "aframe";
import { hasComponent } from "bitecs";
import type { HubsWorld } from "../app";
import { Interacted, ObjectMenu } from "../bit-components";
import { anyEntityWith } from "../utils/bit-utils";
import type { EntityID } from "../utils/networking-types";

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

let menu: EntityID | null;
export function objectMenuSystem(world: HubsWorld, userinput: UserInputSystem) {
  if (!menu) {
    menu = anyEntityWith(world, ObjectMenu);
  }
  if (!menu) {
    return; // TODO: Fix initialization to be deterministic
  }

  if (clicked(world, ObjectMenu.pinButtonRef[menu])) {
    console.log("Clicked pin");
  } else if (clicked(world, ObjectMenu.cameraFocusButtonRef[menu])) {
    console.log("Clicked focus");
  } else if (clicked(world, ObjectMenu.cameraTrackButtonRef[menu])) {
    console.log("Clicked track");
  } else if (clicked(world, ObjectMenu.removeButtonRef[menu])) {
    console.log("Clicked remove");
  } else if (clicked(world, ObjectMenu.dropButtonRef[menu])) {
    console.log("Clicked drop");
  } else if (clicked(world, ObjectMenu.inspectButtonRef[menu])) {
    console.log("Clicked inspect");
  } else if (clicked(world, ObjectMenu.deserializeDrawingButtonRef[menu])) {
    console.log("Clicked deserialize drawing");
  } else if (clicked(world, ObjectMenu.openLinkButtonRef[menu])) {
    console.log("Clicked open link");
  } else if (clicked(world, ObjectMenu.refreshButtonRef[menu])) {
    console.log("Clicked refresh");
  } else if (clicked(world, ObjectMenu.cloneButtonRef[menu])) {
    console.log("Clicked clone");
  } else if (clicked(world, ObjectMenu.rotateButtonRef[menu])) {
    console.log("Clicked rotate");
  } else if (clicked(world, ObjectMenu.mirrorButtonRef[menu])) {
    console.log("Clicked mirror");
  } else if (clicked(world, ObjectMenu.scaleButtonRef[menu])) {
    console.log("Clicked scale");
  }
}
