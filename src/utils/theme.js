import { waitForDOMContentLoaded } from "./async-utils";
import Color from "color";

waitForDOMContentLoaded().then(() => {
  const el = document.querySelector(`meta[name='theme']`);
  const theme = el ? el.getAttribute("content") : "light";
  document.body.classList.add(`${theme}-theme`);

  document.querySelector("#rounded-text-button").setAttribute("text-button", {
    textHoverColor: "#ff3464",
    textColor: "#ff3464",
    backgroundColor: "#fff",
    backgroundHoverColor: "#aaa"
  });

  document.querySelector("#rounded-button").setAttribute("text-button", {
    textHoverColor: "#ff3464",
    textColor: "#ff3464",
    backgroundColor: "#fff",
    backgroundHoverColor: "#aaa"
  });
  document.querySelector("#rounded-text-action-button").setAttribute("text-button", {
    textHoverColor: "#fff",
    textColor: "#fff",
    backgroundColor: "#ff3464",
    backgroundHoverColor: "#fc3545"
  });

  document.querySelector("#rounded-action-button").setAttribute("text-button", {
    textHoverColor: "#fff",
    textColor: "#fff",
    backgroundColor: "#ff3464",
    backgroundHoverColor: "#fc3545"
  });
});

function applyThemeToTextButton(el, highlighted) {
  el.setAttribute("text-button", "backgroundColor", highlighted ? "#fff" : "#ff3550");
  el.setAttribute("text-button", "backgroundHoverColor", highlighted ? "#bbb" : "#fc3545");
}

function getThemeColorShifter(type) {
  const toColor = type === "action" ? "#ff3464" : "#2F80ED";

  // Goal of this algorithm is to take a ctx pointing to a spritesheet
  // that has a single saturated color, and convert it to another.
  return async (ctx, w, h) => {
    const to = Color(toColor);

    const data = ctx.getImageData(0, 0, w, h);
    const d = data.data;
    const histo = {};

    // Assumes saturated color is very un-greyscale
    const isGreyscale = (() => {
      const isClose = (x, y) => Math.abs(x - y) < 5;
      return (r, g, b) => isClose(r, g) && isClose(g, b) && isClose(r, b);
    })();

    for (let i = 0, l = d.length; i < l; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      // Compute a histogram of non-greyscale color frequencies
      if (!isGreyscale(r, g, b)) {
        const sum = r + g * 1000 + b * 1000000;

        // hacky but unique key for a color.
        if (!histo[sum]) {
          histo[sum] = { r, g, b, c: 1 };
        } else {
          histo[sum].c++;
        }
      }
    }

    let max = 0;
    let from;

    // Find most common non-greyscale color to determine HSL shift
    for (const { r, g, b, c } of Object.values(histo)) {
      if (c > max) {
        max = c;
        from = Color({ r, g, b });
      }
    }

    const toHsl = to.hsl();
    const fromHsl = from.hsl();
    const dh = toHsl.hue() - fromHsl.hue();
    const ds = toHsl.saturationl() / fromHsl.saturationl();
    const dl = toHsl.lightness() / fromHsl.lightness();
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
          cache[sum] = { nr, ng, nb };
        }

        const { nr, ng, nb } = cache[sum];
        d[i] = nr;
        d[i + 1] = ng;
        d[i + 2] = nb;
      }
    }

    ctx.putImageData(data, 0, 0);
  };
}

async function waitForThemeReady() {
  return;
}

export { applyThemeToTextButton, getThemeColorShifter, waitForThemeReady };
