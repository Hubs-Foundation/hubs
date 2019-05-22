import { HUD_BACKGROUND, BUTTON_MIC, BUTTON_CREATE, BUTTON_PEN, BUTTON_CAMERA } from "./enum";
export function writeXYWH(f32array, i, data) {
  f32array[4 * i + 0] = data.x;
  f32array[4 * i + 1] = data.y;
  f32array[4 * i + 2] = data.w;
  f32array[4 * i + 3] = data.h;
}

const PEOPLE = {
  x: 0,
  y: 40 / 128.0,
  w: 128 / 512.0,
  h: 48 / 128.0
};
const MIC = {
  x: (128 + 16) / 512.0,
  y: 32 / 128.0,
  w: 64 / 512.0,
  h: 64 / 128.0
};
const CREATE = {
  x: (128 + 16 + 64 + 16) / 512.0,
  y: 0 / 128.0,
  w: 128 / 512.0,
  h: 128 / 128.0
};
const PEN = {
  x: (128 + 16 + 64 + 16 + 128 + 16) / 512.0,
  y: 32 / 128.0,
  w: 64 / 512.0,
  h: 64 / 128.0
};
const CAMERA = {
  x: (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16) / 512.0,
  y: 32 / 128.0,
  w: 64 / 512.0,
  h: 64 / 128.0
};

export const stencils = new Float32Array(20);
writeXYWH(stencils, 0, PEOPLE);
writeXYWH(stencils, 1, MIC);
writeXYWH(stencils, 2, CREATE);
writeXYWH(stencils, 3, PEN);
writeXYWH(stencils, 4, CAMERA);
// writeXYWH(stencils, 4, INVITE);
// writeXYWH(stencils, 4, TOOLTIP_BACKGROUND);

export const determineHoverZone = (function() {
  const WIDTH_IN_PIXELS = 512;
  const MIC_X1 = (128 + 16) / WIDTH_IN_PIXELS;
  const MIC_X2 = (128 + 16 + 64) / WIDTH_IN_PIXELS;
  const CREATE_X1 = (128 + 16 + 64 + 16) / WIDTH_IN_PIXELS;
  const CREATE_X2 = (128 + 16 + 64 + 16 + 128) / WIDTH_IN_PIXELS;
  const PEN_X1 = (128 + 16 + 64 + 16 + 128 + 16) / WIDTH_IN_PIXELS;
  const PEN_X2 = (128 + 16 + 64 + 16 + 128 + 16 + 64) / WIDTH_IN_PIXELS;
  const CAM_X1 = (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16) / WIDTH_IN_PIXELS;
  const CAM_X2 = (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16 + 64) / WIDTH_IN_PIXELS;

  function contains1D(p, min, max) {
    return p > min && p < max;
  }

  return function determineHoverZone(xZeroToOne) {
    if (contains1D(xZeroToOne, MIC_X1, MIC_X2)) {
      return BUTTON_MIC;
    } else if (contains1D(xZeroToOne, CREATE_X1, CREATE_X2)) {
      return BUTTON_CREATE;
    } else if (contains1D(xZeroToOne, PEN_X1, PEN_X2)) {
      return BUTTON_PEN;
    } else if (contains1D(xZeroToOne, CAM_X1, CAM_X2)) {
      return BUTTON_CAMERA;
    }

    return HUD_BACKGROUND;
  };
})();
