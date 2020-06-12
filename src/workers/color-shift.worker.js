import Color from "color";

function getColorShifter(type, color) {
  const from = type === "action" ? Color("#ff3464") : Color("#2F80ED");
  const to = Color(color);

  const toHsl = to.hsl();
  const fromHsl = from.hsl();
  const dh = toHsl.hue() - fromHsl.hue();
  const ds = toHsl.saturationl() / fromHsl.saturationl();
  const dl = toHsl.lightness() / fromHsl.lightness();

  // Goal of this algorithm is to take a ctx pointing to a spritesheet
  // that has a single saturated color, and convert it to another.
  return d => {
    // Assumes saturated color is very un-greyscale
    const isGreyscale = (() => {
      const isClose = (x, y) => Math.abs(x - y) < 5;
      return (r, g, b) => isClose(r, g) && isClose(g, b) && isClose(r, b);
    })();

    const cache = {};

    for (let i = 0, l = d.length; i < l; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      // Compute a histogram of non-greyscale color frequencies
      if (!isGreyscale(r, g, b)) {
        const sum = r + g * 1000 + b * 1000000;

        if (!cache[sum]) {
          let hsl = Color({ r, g, b }).hsl();
          hsl = hsl.rotate(dh);
          hsl.color[1] *= ds;
          hsl.color[2] *= dl;

          const [nr, ng, nb] = hsl.rgb().array();
          cache[sum] = [nr, ng, nb];
        }

        const [nr, ng, nb] = cache[sum];
        d[i] = nr;
        d[i + 1] = ng;
        d[i + 2] = nb;
      }
    }

    return d;
  };
}

self.onmessage = msg => {
  const result = getColorShifter(msg.data.type, msg.data.color)(new Uint8ClampedArray(msg.data.payload));
  self.postMessage({ id: msg.data.id, result });
};
