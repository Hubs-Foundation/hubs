import { defineQuery, hasComponent } from "bitecs";
import { CameraTool, Interacted } from "../bit-components";

function click(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

const query_camera_tool = defineQuery([CameraTool]);

export function cameraSystem(world) {
  query_camera_tool(world).forEach(camera => {
    if (click(CameraTool.button_cancel[camera])) {
      console.log("Button Cancel Pressed!");
    }

    if (click(CameraTool.button_next[camera])) {
      console.log("Button Next Pressed!");
    }

    if (click(CameraTool.button_prev[camera])) {
      console.log("Button Prev Pressed!");
    }
  });
}
