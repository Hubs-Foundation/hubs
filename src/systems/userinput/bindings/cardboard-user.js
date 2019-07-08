import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

export const cardboardUserBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: { value: paths.device.touchscreen.isTouching },
      dest: {
        value: paths.actions.startGazeTeleport
      },
      xform: xforms.rising
    },
    {
      src: { value: paths.device.touchscreen.isTouching },
      dest: {
        value: paths.actions.stopGazeTeleport
      },
      xform: xforms.falling
    }
  ]
});
