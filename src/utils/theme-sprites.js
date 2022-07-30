import "./configs";
import { getThemeColor } from "./theme";
import ColorShiftWorker from "../workers/color-shift.worker.js";
import { promisifyWorker } from "./promisify-worker.js";
const colorShift = promisifyWorker(new ColorShiftWorker());

function getThemeColorShifter(type) {
  // Goal of this algorithm is to take a ctx pointing to a spritesheet
  // that has a single saturated color, and convert it to another.
  return async (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    const color = type === "action" ? getThemeColor("action-color") : getThemeColor("notice-background-color");
    const res = await colorShift(data.data.buffer, [data.data.buffer], { type, color });
    ctx.putImageData(new ImageData(res, w, h), 0, 0);
  };
}

export { getThemeColorShifter };
