/**
 *
 * Gif parser by @gtk2k
 * https://github.com/gtk2k/gtk2k.github.io/tree/master/animation_gif
 *
 */

const parseGIF = function (gif) {
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
          throw new Error("parseGIF: unknown label");
        }
      } else if (blockId === 0x2c) {
        pos += 9;
        pos += 1 + +!!(gif[pos] & 0x80) * (Math.pow(2, (gif[pos] & 0x07) + 1) * 3);
        while (gif[++pos]) pos += gif[pos];
        const imageData = gif.subarray(offset, pos + 1);
        frames.push(URL.createObjectURL(new Blob([gifHeader, graphicControl, imageData])));
      } else {
        throw new Error("parseGIF: unknown blockId");
      }
      pos++;
    }
  } else {
    throw new Error("parseGIF: no GIF89a");
  }
  return { delayTimes, loopCnt, frames, disposals };
};

self.onmessage = msg => {
  try {
    const result = parseGIF(new Uint8Array(msg.data.payload));
    self.postMessage({ id: msg.data.id, result });
  } catch (e) {
    self.postMessage({ id: msg.data.id, err: e.message });
  }
};
