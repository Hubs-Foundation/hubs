import { waitForDOMContentLoaded } from "./async-utils";
import ColorShiftWorker from "../workers/color-shift.worker.js";
import { promisifyWorker } from "./promisify-worker.js";
const colorShift = promisifyWorker(new ColorShiftWorker());

waitForDOMContentLoaded().then(() => {
  const el = document.querySelector(`meta[name='theme']`);
  const theme = el ? el.getAttribute("content") : "light";
  document.body.classList.add(`${theme}-theme`);
  const actionColor = "#ff3464";
  const actionHoverColor = "#fc3545";

  // NOTE, using the object-based {} setAttribute variant in a-frame
  // seems to not work in Firefox here -- the entities with the mixins are not
  // updated.
  document
    .querySelector("#rounded-text-button")
    .setAttribute(
      "text-button",
      `textHoverColor: ${actionHoverColor}; textColor: ${actionColor}; backgroundColor: #fff; backgroundHoverColor: #aaa;`
    );

  document
    .querySelector("#rounded-button")
    .setAttribute(
      "text-button",
      `textHoverColor: ${actionHoverColor}; textColor: ${actionColor}; backgroundColor: #fff; backgroundHoverColor: #aaa;`
    );

  document
    .querySelector("#rounded-text-action-button")
    .setAttribute(
      "text-button",
      `textHoverColor: #fff; textColor: #fff; backgroundColor: ${actionColor}; backgroundHoverColor: ${actionHoverColor}`
    );

  document
    .querySelector("#rounded-action-button")
    .setAttribute(
      "text-button",
      `textHoverColor: #fff; textColor: #fff; backgroundColor: ${actionColor}; backgroundHoverColor: ${actionHoverColor}`
    );
});

function applyThemeToTextButton(el, highlighted) {
  el.setAttribute("text-button", "backgroundColor", highlighted ? "#fff" : "#ff3550");
  el.setAttribute("text-button", "backgroundHoverColor", highlighted ? "#bbb" : "#fc3545");
}

function getThemeColorShifter(type) {
  // Goal of this algorithm is to take a ctx pointing to a spritesheet
  // that has a single saturated color, and convert it to another.
  return async (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    const res = await colorShift(data.data.buffer, [data.data.buffer], { type: type });
    ctx.putImageData(new ImageData(res, w, h), 0, 0);
  };
}

async function waitForThemeReady() {
  return;
}

export { applyThemeToTextButton, getThemeColorShifter, waitForThemeReady };
