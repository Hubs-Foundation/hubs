import { paths } from "../paths";
import { sets } from "../sets";
import { xforms } from "./xforms";

export const keyboardDebugBindings = {
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
};


