import { GIF } from "gif-engine-js";

const getDisposals = frameObj => (frameObj.graphicExtension && frameObj.graphicExtension.disposalMethod) || 0;
const getDelays = frameObj => (frameObj.graphicExtension && frameObj.graphicExtension.delay - 1) || 0;
const copyColorsTransparent = async (source, target, fWidth, fHeight, oLeft, oTop, cWidth, flag) => {
  for (let row = 0, pointer = -1; fHeight > row; ++row)
    for (let column = 0; fWidth > column; ++column) {
      let offset = (column + oLeft + (row + oTop) * cWidth) * 4;
      if (flag && source[pointer + 4] === 0) {
        pointer += 4;
        continue;
      }
      target[offset] = source[++pointer];
      target[++offset] = source[++pointer];
      target[++offset] = source[++pointer];
      ++pointer;
      target[++offset] = flag ? source[pointer] : 255;
    }
};
const messageHandler = async e => {
  try {
    const o = await GIF(e.data);
    const frameCount = o.frames.length;
    const compiledFrames = new Array(frameCount);
    const delays = o.frames.map(getDelays);
    const canvasWidth = o.descriptor.width;
    const canvasHeight = o.descriptor.height;
    const disposals = o.frames.map(getDisposals);
    const canvas = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
    let index = 0;
    do {
      const frame = o.frames[index];
      const transparentColorFlag = frame.graphicExtension && frame.graphicExtension.transparentColorFlag;
      const [
        { data: frameImageData, width: frameWidth, height: frameHeight },
        offsetLeft,
        offsetTop
      ] = await o.toImageData(index);
      await copyColorsTransparent(
        frameImageData,
        canvas,
        frameWidth,
        frameHeight,
        offsetLeft,
        offsetTop,
        canvasWidth,
        transparentColorFlag
      );
      const a = new Uint8ClampedArray(canvas);
      compiledFrames[index] = [new ImageData(a, canvasWidth, canvasHeight)];
      if (disposals[index] === 2) {
        for (let row = 0; frameHeight > row; ++row) {
          for (let column = 0; frameWidth > column; ++column) {
            let offset = (column + offsetLeft + (row + offsetTop) * canvasWidth) * 4;
            canvas[offset] = 0;
            canvas[++offset] = 0;
            canvas[++offset] = 0;
            canvas[++offset] = transparentColorFlag ? 0 : 255;
          }
        }
      }
    } while (++index < frameCount);
    postMessage([compiledFrames, delays, canvasWidth, canvasHeight]);
  } catch (er) {
    console.error(er);
  }
};
(global => {
  global.onmessage = messageHandler;
  global.onerror = e => {
    postMessage(["log", e]);
  };
})((() => self)());
