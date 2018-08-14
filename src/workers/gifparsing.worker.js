/**
 *
 * Gif parser by @gtk2k
 * https://github.com/gtk2k/gtk2k.github.io/tree/master/animation_gif
 *
 */

const parseGIF = function(gif, successCB, errorCB) {
  let pos = 0;
  const delayTimes = [];
  let graphicControl = null;
  const frames = [];
  const disposals = [];
  let loopCnt = 0;
  if (
    gif[0] === 0x47 &&
    gif[1] === 0x49 &&
    gif[2] === 0x46 && // 'GIF'
    gif[3] === 0x38 &&
    gif[4] === 0x39 &&
    gif[5] === 0x61
  ) {
    // '89a'
    pos += 13 + +!!(gif[10] & 0x80) * Math.pow(2, (gif[10] & 0x07) + 1) * 3;
    const gifHeader = gif.subarray(0, pos);
    while (gif[pos] && gif[pos] !== 0x3b) {
      const offset = pos,
        blockId = gif[pos];
      if (blockId === 0x21) {
        const label = gif[++pos];
        if ([0x01, 0xfe, 0xf9, 0xff].indexOf(label) !== -1) {
          label === 0xf9 && delayTimes.push((gif[pos + 3] + (gif[pos + 4] << 8)) * 10);
          label === 0xff && (loopCnt = gif[pos + 15] + (gif[pos + 16] << 8));
          while (gif[++pos]) pos += gif[pos];
          if (label === 0xf9) {
            graphicControl = gif.subarray(offset, pos + 1);
            disposals.push((graphicControl[3] >> 2) & 0x07);
          }
        } else {
          errorCB && errorCB("parseGIF: unknown label");
          break;
        }
      } else if (blockId === 0x2c) {
        pos += 9;
        pos += 1 + +!!(gif[pos] & 0x80) * (Math.pow(2, (gif[pos] & 0x07) + 1) * 3);
        while (gif[++pos]) pos += gif[pos];
        const imageData = gif.subarray(offset, pos + 1);
        frames.push(URL.createObjectURL(new Blob([gifHeader, graphicControl, imageData])));
      } else {
        errorCB && errorCB("parseGIF: unknown blockId");
        break;
      }
      pos++;
    }
  } else {
    errorCB && errorCB("parseGIF: no GIF89a");
  }
  successCB && successCB(delayTimes, loopCnt, frames, disposals);
};

self.onmessage = e => {
  parseGIF(
    new Uint8Array(e.data),
    (delays, loopcnt, frames, disposals) => {
      self.postMessage([true, frames, delays, disposals]);
      delete self.onmessage;
    },
    err => {
      console.error("Error in gif parsing worker", err);
      self.postMessage([false, err]);
      delete self.onmessage;
    }
  );
};
