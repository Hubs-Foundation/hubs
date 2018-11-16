import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";
import { addSetsToBindings } from "./utils";

export const keyboardDebuggingBindings = addSetsToBindings({
  [sets.global]: [
    {
      src: {
        value: paths.device.keyboard.key("l")
      },
      dest: {
        value: paths.actions.logDebugFrame
      },
      xform: xforms.rising
    }
  ]
});
