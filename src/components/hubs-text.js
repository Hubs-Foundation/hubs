import createTextGeometry from "three-bmfont-text";

// 1 to match other A-Frame default widths.
const DEFAULT_WIDTH = 1;

// @bryik set anisotropy to 16. Improves look of large amounts of text when viewed from angle.
const MAX_ANISOTROPY = 16;

/**
 * Due to using negative scale, we return the opposite side specified.
 * https://github.com/mrdoob/three.js/pull/12787/
 */
function parseSide(side) {
  switch (side) {
    case "back": {
      return THREE.FrontSide;
    }
    case "double": {
      return THREE.DoubleSide;
    }
    default: {
      return THREE.BackSide;
    }
  }
}

/**
 * Determine wrap pixel count. Either specified or by experimental fudge factor.
 * Note that experimental factor will never be correct for variable width fonts.
 */
function computeWidth(wrapPixels, wrapCount, widthFactor) {
  return wrapPixels || (0.5 + wrapCount) * widthFactor;
}

/**
 * Compute default font width factor to use.
 */
function computeFontWidthFactor(font) {
  let sum = 0;
  let digitsum = 0;
  let digits = 0;
  for (const ch of font.chars) {
    sum += ch.xadvance;
    if (ch.id >= 48 && ch.id <= 57) {
      digits++;
      digitsum += ch.xadvance;
    }
  }
  return digits ? digitsum / digits : sum / font.chars.length;
}

function loadFont(src) {
  return fetch(src)
    .then(resp => resp.json())
    .then(font => {
      // Fix negative Y offsets for Roboto MSDF font from tool. Experimentally determined.
      if (src.indexOf(".json") >= 0) {
        for (const ch of font.chars) {
          ch.yoffset += 30;
        }
      }
      font.widthFactor = computeFontWidthFactor(font);
      return font;
    });
}

function loadTexture(src) {
  return new Promise((resolve, reject) => {
    new THREE.ImageLoader().load(
      src,
      image => {
        const texture = new THREE.Texture();
        texture.image = image;
        texture.needsUpdate = true;
        texture.anisotropy = MAX_ANISOTROPY;
        resolve(texture);
      },
      undefined,
      err => {
        console.error("Error loading font image", src, err);
        reject(null);
      }
    );
  });
}

const FONTS = {
  roboto: {
    json: loadFont("https://hubs-1-assets.hubs.belivvr.com/assets/fonts/SpoqaHanSansNeo-Regular.json"),
    texture: loadTexture("https://hubs-1-assets.hubs.belivvr.com/assets/fonts/SpoqaHanSansNeo-Regular.png")
  }
};

AFRAME.registerComponent("text", {
  multiple: true,
  schema: {
    align: { type: "string", default: "left", oneOf: ["left", "right", "center"] },
    alphaTest: { default: 0.5 },
    // `anchor` defaults to center to match geometries.
    anchor: { default: "center", oneOf: ["left", "right", "center", "align"] },
    baseline: { default: "center", oneOf: ["top", "center", "bottom"] },
    color: { type: "color", default: "#FFF" },
    font: { type: "string", default: "roboto" },
    // `height` has no default, will be populated at layout.
    height: { type: "number" },
    letterSpacing: { type: "number", default: 0 },
    // `lineHeight` defaults to font's `lineHeight` value.
    lineHeight: { type: "number" },
    // `negate` must be true for fonts generated with older versions of msdfgen (white background).
    negate: { type: "boolean", default: true },
    opacity: { type: "number", default: 1.0 },
    side: { default: "front", oneOf: ["front", "back", "double"] },
    tabSize: { default: 4 },
    transparent: { default: true },
    value: { type: "string" },
    whiteSpace: { default: "normal", oneOf: ["normal", "pre", "nowrap"] },
    // `width` defaults to geometry width if present, else `DEFAULT_WIDTH`.
    width: { type: "number" },
    // `wrapCount` units are about one default font character. Wrap roughly at this number.
    wrapCount: { type: "number", default: 40 },
    // `wrapPixels` will wrap using bmfont pixel units (e.g., dejavu's is 32 pixels).
    wrapPixels: { type: "number" },
    // `xOffset` to add padding.
    xOffset: { type: "number", default: 0 },
    // `zOffset` will provide a small z offset to avoid z-fighting.
    zOffset: { type: "number", default: 0.001 }
  },

  init: function() {
    const shaderData = this.getShaderData(this.data);
    this.shaderObject = new AFRAME.shaders["msdf"].Shader();
    this.shaderObject.el = this.el;
    this.shaderObject.init(shaderData);
    this.shaderObject.update(shaderData);
    this.shaderObject.material.transparent = shaderData.transparent; // Apparently, was not set on `init` nor `update`.
    this.shaderObject.material.side = shaderData.side;
    this.geometry = createTextGeometry();
    this.mesh = new THREE.Mesh(this.geometry, this.shaderObject.material);
    this.el.setObject3D(this.attrName, this.mesh);
  },

  update: function(oldData) {
    const data = this.data;
    const shaderData = this.getShaderData(this.data);
    this.shaderObject.update(shaderData);
    this.shaderObject.material.transparent = shaderData.transparent; // Apparently, was not set on `init` nor `update`.
    this.shaderObject.material.side = shaderData.side;

    // New font. `updateFont` will later change data and layout.
    if (oldData.font !== data.font) {
      this.updateFont().catch(err => console.error(err));
    }

    // Not a new font, but we need to accomodate other changes with the existing font.
    if (this.currentFont != null) {
      this.updateGeometry(this.geometry, this.currentFont);
      this.updateLayout(this.currentFont);
    }
  },

  /**
   * Clean up geometry, material, texture, mesh, objects.
   */
  remove: function() {
    this.geometry.dispose();
    this.geometry = null;
    this.el.removeObject3D(this.attrName);
    this.shaderObject.material.dispose();
    this.shaderObject.material = null;
    delete this.shaderObject;
  },

  getShaderData: (function() {
    const shaderData = {};
    return function(data) {
      shaderData.alphaTest = data.alphaTest;
      shaderData.color = data.color;
      shaderData.opacity = data.opacity;
      shaderData.side = parseSide(data.side);
      shaderData.transparent = data.transparent;
      shaderData.negate = data.negate;
      return shaderData;
    };
  })(),

  /**
   * Load font for geometry, load font image for material, and apply.
   */
  updateFont: function() {
    const data = this.data;
    const geometry = this.geometry;

    // Make invisible during font swap.
    this.mesh.visible = false;
    const fetchFontData = Promise.all([FONTS[data.font].json, FONTS[data.font].texture]);
    return fetchFontData.then(([font, texture]) => {
      if (font.pages.length !== 1) {
        throw new Error("Currently only single-page bitmap fonts are supported.");
      }
      this.currentFont = font;
      this.updateGeometry(geometry, font);
      this.shaderObject.update({ map: texture });
      this.updateLayout(font);
      this.mesh.visible = true;
    });
  },

  /**
   * Update layout with anchor, alignment, baseline, and considering any meshes.
   */
  updateLayout: function(font) {
    const el = this.el;
    const data = this.data;
    const geometry = this.geometry;
    const mesh = this.mesh;

    if (!geometry.layout) {
      return;
    }

    // Determine width to use (defined width, geometry's width, or default width).
    const geometryComponent = el.getAttribute("geometry");
    const width = data.width || (geometryComponent && geometryComponent.width) || DEFAULT_WIDTH;

    // Determine wrap pixel count. Either specified or by experimental fudge factor.
    // Note that experimental factor will never be correct for variable width fonts.
    const textRenderWidth = computeWidth(data.wrapPixels, data.wrapCount, font.widthFactor);
    const textScale = width / textRenderWidth;

    // Determine height to use.
    const layout = geometry.layout;
    const height = textScale * (layout.height + layout.descender);

    // Update geometry dimensions to match text layout if width and height are set to 0.
    // For example, scales a plane to fit text.
    if (geometryComponent && geometryComponent.primitive === "plane") {
      if (!geometryComponent.width) {
        el.setAttribute("geometry", "width", width);
      }
      if (!geometryComponent.height) {
        el.setAttribute("geometry", "height", height);
      }
    }

    // Calculate X position to anchor text left, center, or right.
    const anchor = data.anchor === "align" ? data.align : data.anchor;
    let x, y;
    if (anchor === "left") {
      x = 0;
    } else if (anchor === "right") {
      x = -1 * layout.width;
    } else if (anchor === "center") {
      x = (-1 * layout.width) / 2;
    } else {
      throw new TypeError("Invalid text.anchor property value", anchor);
    }

    // Calculate Y position to anchor text top, center, or bottom.
    const baseline = data.baseline;
    if (baseline === "bottom") {
      y = 0;
    } else if (baseline === "top") {
      y = -1 * layout.height + layout.ascender;
    } else if (baseline === "center") {
      y = (-1 * layout.height) / 2;
    } else {
      throw new TypeError("Invalid text.baseline property value", baseline);
    }

    // Position and scale mesh to apply layout.
    mesh.position.x = x * textScale + data.xOffset;
    mesh.position.y = y * textScale;
    // Place text slightly in front to avoid Z-fighting.
    mesh.position.z = data.zOffset;
    mesh.scale.set(textScale, -1 * textScale, textScale);
    mesh.matrixNeedsUpdate = true;
  },

  /**
   * Update the text geometry using `three-bmfont-text.update`.
   */
  updateGeometry: (function() {
    const geometryUpdateBase = {};
    const geometryUpdateData = {};
    const newLineRegex = /\\n/g;
    const tabRegex = /\\t/g;

    return function(geometry, font) {
      const data = this.data;

      geometryUpdateData.font = font;
      geometryUpdateData.lineHeight =
        data.lineHeight && isFinite(data.lineHeight) ? data.lineHeight : font.common.lineHeight;
      geometryUpdateData.text = data.value
        .toString()
        .replace(newLineRegex, "\n")
        .replace(tabRegex, "\t");
      geometryUpdateData.width = computeWidth(data.wrapPixels, data.wrapCount, font.widthFactor);
      geometry.update(Object.assign(geometryUpdateBase, data, geometryUpdateData));
      geometry.boundingBox = null;
      geometry.boundingSphere = null;
    };
  })()
});
